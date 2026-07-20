using RuzoSolutions.Domain;

namespace RuzoSolutions.Application;

public sealed record CampaignDto(Guid Id, string Name, string Channel, string Audience, int TargetVolume, string Status, long Processed, long Delivered, long Failed, decimal DeliveryRate, DateTimeOffset UpdatedAt);
public sealed record CreateCampaignRequest(string Name, string Channel, string Audience, int TargetVolume);
public sealed record DashboardSnapshot(long TotalProcessed, decimal DeliveryRate, int ActiveCampaigns, int ThroughputPerSecond, int QueueDepth, int P95LatencyMs, IReadOnlyList<int> ThroughputHistory, IReadOnlyList<CampaignDto> Campaigns);
public sealed record DeliveryEvent(Guid Id, Guid CampaignId, string Campaign, string Channel, string Status, int BatchSize, int LatencyMs, DateTimeOffset OccurredAt);
public sealed record PortfolioProfile(string Product, string Mission, IReadOnlyList<string> Capabilities, IReadOnlyList<CareerEvidence> CareerEvidence, IReadOnlyList<ArchitectureNode> Architecture);
public sealed record CareerEvidence(string Period, string Role, string Company, string Signal);
public sealed record ArchitectureNode(string Layer, string Responsibility, IReadOnlyList<string> Technologies);

public interface ICampaignRepository
{
    Task<IReadOnlyList<Campaign>> ListAsync(CancellationToken cancellationToken);
    Task<Campaign?> GetAsync(Guid id, CancellationToken cancellationToken);
    Task AddAsync(Campaign campaign, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public interface IDeliveryEventSink
{
    Task PublishAsync(DeliveryEvent deliveryEvent, CancellationToken cancellationToken);
}
