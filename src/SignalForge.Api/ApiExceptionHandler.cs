using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace SignalForge.Api;

public sealed partial class ApiExceptionHandler(ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var status = exception switch
        {
            ArgumentException => StatusCodes.Status400BadRequest,
            InvalidOperationException => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status500InternalServerError
        };

        LogRequestFailure(logger, status, exception);
        httpContext.Response.StatusCode = status;
        await httpContext.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = status,
            Title = status == 500 ? "An unexpected error occurred." : exception.Message,
            Type = $"https://httpstatuses.com/{status}"
        }, cancellationToken);
        return true;
    }

    [LoggerMessage(EventId = 1001, Level = LogLevel.Error, Message = "Request failed with status {StatusCode}")]
    private static partial void LogRequestFailure(ILogger logger, int statusCode, Exception exception);
}
