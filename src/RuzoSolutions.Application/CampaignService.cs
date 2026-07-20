using RuzoSolutions.Domain;

namespace RuzoSolutions.Application;

public sealed class CampaignService(ICampaignRepository repository)
{
    public async Task<IReadOnlyList<CampaignDto>> ListAsync(CancellationToken cancellationToken)
    {
        var campaigns = await repository.ListAsync(cancellationToken);
        return campaigns.Select(Map).ToArray();
    }

    public async Task<CampaignDto> CreateAsync(CreateCampaignRequest request, CancellationToken cancellationToken)
    {
        var campaign = Campaign.Create(request.Name, request.Channel, request.Audience, request.TargetVolume);
        await repository.AddAsync(campaign, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return Map(campaign);
    }

    public async Task<CampaignDto?> LaunchAsync(Guid id, CancellationToken cancellationToken) =>
        await ChangeStateAsync(id, value => value.Launch(), cancellationToken);

    public async Task<CampaignDto?> PauseAsync(Guid id, CancellationToken cancellationToken) =>
        await ChangeStateAsync(id, value => value.Pause(), cancellationToken);

    private async Task<CampaignDto?> ChangeStateAsync(Guid id, Action<Campaign> change, CancellationToken cancellationToken)
    {
        var campaign = await repository.GetAsync(id, cancellationToken);
        if (campaign is null)
        {
            return null;
        }

        change(campaign);
        await repository.SaveChangesAsync(cancellationToken);
        return Map(campaign);
    }

    public static CampaignDto Map(Campaign campaign) => new(campaign.Id, campaign.Name, campaign.Channel, campaign.Audience, campaign.TargetVolume, campaign.Status.ToString(), campaign.Processed, campaign.Delivered, campaign.Failed, campaign.DeliveryRate, campaign.UpdatedAt);
}
