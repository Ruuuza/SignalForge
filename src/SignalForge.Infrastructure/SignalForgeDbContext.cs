using Microsoft.EntityFrameworkCore;
using SignalForge.Domain;

namespace SignalForge.Infrastructure;

public sealed class SignalForgeDbContext(DbContextOptions<SignalForgeDbContext> options) : DbContext(options)
{
    public DbSet<Campaign> Campaigns => Set<Campaign>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var campaign = modelBuilder.Entity<Campaign>();
        campaign.ToTable("campaigns");
        campaign.HasKey(value => value.Id);
        campaign.Property(value => value.Name).HasMaxLength(120).IsRequired();
        campaign.Property(value => value.Channel).HasMaxLength(32).IsRequired();
        campaign.Property(value => value.Audience).HasMaxLength(120).IsRequired();
        campaign.Property(value => value.Status).HasConversion<string>().HasMaxLength(24);
        campaign.HasIndex(value => value.Status);
        campaign.Ignore(value => value.DeliveryRate);
    }
}
