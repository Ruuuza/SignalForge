using Microsoft.EntityFrameworkCore;
using SignalForge.Application;
using SignalForge.Domain;

namespace SignalForge.Infrastructure;

public sealed class CampaignRepository(SignalForgeDbContext dbContext) : ICampaignRepository
{
    public async Task<IReadOnlyList<Campaign>> ListAsync(CancellationToken cancellationToken)
    {
        var campaigns = await dbContext.Campaigns.ToListAsync(cancellationToken);
        return campaigns.OrderByDescending(value => value.UpdatedAt).ToArray();
    }

    public Task<Campaign?> GetAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.Campaigns.SingleOrDefaultAsync(value => value.Id == id, cancellationToken);

    public Task AddAsync(Campaign campaign, CancellationToken cancellationToken) =>
        dbContext.Campaigns.AddAsync(campaign, cancellationToken).AsTask();

    public async Task SaveChangesAsync(CancellationToken cancellationToken) =>
        await dbContext.SaveChangesAsync(cancellationToken);
}
