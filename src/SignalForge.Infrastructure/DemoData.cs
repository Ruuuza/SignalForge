using Microsoft.EntityFrameworkCore;
using SignalForge.Domain;

namespace SignalForge.Infrastructure;

public static class DemoData
{
    public static async Task InitializeAsync(SignalForgeDbContext dbContext, CancellationToken cancellationToken = default)
    {
        await dbContext.Database.EnsureCreatedAsync(cancellationToken);
        if (await dbContext.Campaigns.AnyAsync(cancellationToken))
        {
            return;
        }

        var campaigns = new[]
        {
            CreateLive("Win-back intelligence", "Push", "Dormant customers / 90d", 380_000, 128_400, 1_230),
            CreateLive("Creator launch sequence", "Email", "High-intent creators", 240_000, 84_200, 740),
            CreateLive("Cart recovery pulse", "WhatsApp", "Abandoned checkout / 2h", 610_000, 301_800, 2_010),
            Campaign.Create("Loyalty tier migration", "SMS", "Gold and platinum", 185_000)
        };

        dbContext.Campaigns.AddRange(campaigns);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static Campaign CreateLive(string name, string channel, string audience, int target, int delivered, int failed)
    {
        var campaign = Campaign.Create(name, channel, audience, target);
        campaign.Launch();
        campaign.RecordBatch(delivered, failed);
        return campaign;
    }
}
