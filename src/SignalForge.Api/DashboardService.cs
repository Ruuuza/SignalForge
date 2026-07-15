using SignalForge.Application;
using SignalForge.Domain;

namespace SignalForge.Api;

public sealed class DashboardService(ICampaignRepository repository)
{
    public async Task<DashboardSnapshot> GetAsync(CancellationToken cancellationToken)
    {
        var campaigns = await repository.ListAsync(cancellationToken);
        var total = campaigns.Sum(value => value.Processed);
        var delivered = campaigns.Sum(value => value.Delivered);
        var active = campaigns.Count(value => value.Status == CampaignStatus.Live);
        var throughput = active == 0 ? 0 : 2_400 + active * 917 + Random.Shared.Next(120, 640);
        var history = Enumerable.Range(0, 20)
            .Select(index => Math.Max(0, throughput - 850 + (index * 97 % 620) + Random.Shared.Next(-180, 180)))
            .ToArray();

        return new DashboardSnapshot(
            total,
            total == 0 ? 0 : Math.Round((decimal)delivered / total * 100, 2),
            active,
            throughput,
            active * 163 + Random.Shared.Next(20, 180),
            active == 0 ? 0 : Random.Shared.Next(72, 148),
            history,
            campaigns.Select(CampaignService.Map).ToArray());
    }
}
