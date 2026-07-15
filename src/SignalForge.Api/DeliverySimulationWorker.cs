using SignalForge.Application;
using SignalForge.Domain;

namespace SignalForge.Api;

public sealed partial class DeliverySimulationWorker(IServiceScopeFactory scopeFactory, IDeliveryEventSink eventSink, ILogger<DeliverySimulationWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(2));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await ProcessBatchAsync(stoppingToken);
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                LogSkippedBatch(logger, exception);
            }
        }
    }

    private async Task ProcessBatchAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var repository = scope.ServiceProvider.GetRequiredService<ICampaignRepository>();
        var campaigns = await repository.ListAsync(cancellationToken);
        var liveCampaigns = campaigns.Where(value => value.Status == CampaignStatus.Live).ToArray();
        if (liveCampaigns.Length == 0)
        {
            return;
        }

        var campaign = liveCampaigns[Random.Shared.Next(liveCampaigns.Length)];
        var remaining = Math.Max(1, campaign.TargetVolume - (int)campaign.Processed);
        var batchSize = Math.Min(remaining, Random.Shared.Next(380, 1_400));
        var failed = Math.Max(1, (int)Math.Round(batchSize * Random.Shared.NextDouble() * 0.018));
        var delivered = batchSize - failed;
        campaign.RecordBatch(delivered, failed);
        await repository.SaveChangesAsync(cancellationToken);

        await eventSink.PublishAsync(new DeliveryEvent(
            Guid.NewGuid(), campaign.Id, campaign.Name, campaign.Channel,
            failed > batchSize * 0.012 ? "Degraded" : "Delivered",
            batchSize, Random.Shared.Next(48, 164), DateTimeOffset.UtcNow), cancellationToken);
    }

    [LoggerMessage(EventId = 2001, Level = LogLevel.Warning, Message = "The simulated delivery batch was skipped")]
    private static partial void LogSkippedBatch(ILogger logger, Exception exception);
}
