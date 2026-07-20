using Microsoft.AspNetCore.SignalR;
using RuzoSolutions.Application;

namespace RuzoSolutions.Api;

public sealed class DeliveryHub : Hub;

public sealed class SignalRDeliveryEventSink(IHubContext<DeliveryHub> hubContext) : IDeliveryEventSink
{
    public Task PublishAsync(DeliveryEvent deliveryEvent, CancellationToken cancellationToken) =>
        hubContext.Clients.All.SendAsync("deliveryEvent", deliveryEvent, cancellationToken);
}
