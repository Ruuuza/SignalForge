using System.Threading.RateLimiting;
using Microsoft.EntityFrameworkCore;
using SignalForge.Api;
using SignalForge.Application;
using SignalForge.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("SignalForge") ?? "Data Source=data/signalforge.db";

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddOpenApi();
builder.Services.AddSignalR();
builder.Services.AddResponseCompression();
builder.Services.AddHealthChecks();
builder.Services.AddCors(options => options.AddPolicy("development", policy =>
    policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "local",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 120,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 10,
                AutoReplenishment = true
            }));
});

builder.Services.AddDbContext<SignalForgeDbContext>(options => options.UseSqlite(connectionString));
builder.Services.AddScoped<ICampaignRepository, CampaignRepository>();
builder.Services.AddScoped<CampaignService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddSingleton<IDeliveryEventSink, SignalRDeliveryEventSink>();
builder.Services.AddHostedService<DeliverySimulationWorker>();

var app = builder.Build();
Directory.CreateDirectory(Path.Combine(app.Environment.ContentRootPath, "data"));

using (var scope = app.Services.CreateScope())
{
    await DemoData.InitializeAsync(scope.ServiceProvider.GetRequiredService<SignalForgeDbContext>());
}

app.UseExceptionHandler();
app.UseRateLimiter();
app.UseResponseCompression();

if (app.Environment.IsDevelopment())
{
    app.UseCors("development");
    app.MapOpenApi();
}

app.UseDefaultFiles();
app.UseStaticFiles();

var api = app.MapGroup("/api");
api.MapGet("/dashboard", (DashboardService service, CancellationToken token) => service.GetAsync(token));
api.MapGet("/campaigns", (CampaignService service, CancellationToken token) => service.ListAsync(token));
api.MapPost("/campaigns", async (CreateCampaignRequest request, CampaignService service, CancellationToken token) =>
    Results.Created("/api/campaigns", await service.CreateAsync(request, token)));
api.MapPost("/campaigns/{id:guid}/launch", async (Guid id, CampaignService service, CancellationToken token) =>
    await service.LaunchAsync(id, token) is { } campaign ? Results.Ok(campaign) : Results.NotFound());
api.MapPost("/campaigns/{id:guid}/pause", async (Guid id, CampaignService service, CancellationToken token) =>
    await service.PauseAsync(id, token) is { } campaign ? Results.Ok(campaign) : Results.NotFound());
api.MapGet("/portfolio", PortfolioData.Create);

app.MapHub<DeliveryHub>("/hubs/delivery");
app.MapHealthChecks("/health");
app.MapFallbackToFile("index.html");

await app.RunAsync();

public partial class Program;
