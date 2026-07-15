namespace SignalForge.Domain;

public enum CampaignStatus
{
    Draft,
    Live,
    Paused,
    Completed
}

public sealed class Campaign
{
    private Campaign() { }

    private Campaign(Guid id, string name, string channel, string audience, int targetVolume)
    {
        Id = id;
        Name = name;
        Channel = channel;
        Audience = audience;
        TargetVolume = targetVolume;
        Status = CampaignStatus.Draft;
        CreatedAt = DateTimeOffset.UtcNow;
        UpdatedAt = CreatedAt;
    }

    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Channel { get; private set; } = string.Empty;
    public string Audience { get; private set; } = string.Empty;
    public int TargetVolume { get; private set; }
    public CampaignStatus Status { get; private set; }
    public long Processed { get; private set; }
    public long Delivered { get; private set; }
    public long Failed { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public decimal DeliveryRate => Processed == 0 ? 0 : Math.Round((decimal)Delivered / Processed * 100, 2);

    public static Campaign Create(string name, string channel, string audience, int targetVolume)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(channel);
        ArgumentException.ThrowIfNullOrWhiteSpace(audience);

        if (targetVolume is < 1 or > 10_000_000)
        {
            throw new ArgumentOutOfRangeException(nameof(targetVolume), "Target volume must be between 1 and 10,000,000.");
        }

        return new Campaign(Guid.NewGuid(), name.Trim(), channel.Trim(), audience.Trim(), targetVolume);
    }

    public void Launch()
    {
        if (Status is CampaignStatus.Completed)
        {
            throw new InvalidOperationException("A completed campaign cannot be relaunched.");
        }

        Status = CampaignStatus.Live;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Pause()
    {
        if (Status is not CampaignStatus.Live)
        {
            throw new InvalidOperationException("Only live campaigns can be paused.");
        }

        Status = CampaignStatus.Paused;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void RecordBatch(int delivered, int failed)
    {
        if (Status is not CampaignStatus.Live)
        {
            throw new InvalidOperationException("Delivery metrics can only be recorded for a live campaign.");
        }

        if (delivered < 0 || failed < 0 || delivered + failed == 0)
        {
            throw new ArgumentOutOfRangeException(nameof(delivered), "A batch must contain at least one non-negative outcome.");
        }

        Delivered += delivered;
        Failed += failed;
        Processed += delivered + failed;
        UpdatedAt = DateTimeOffset.UtcNow;

        if (Processed >= TargetVolume)
        {
            Status = CampaignStatus.Completed;
        }
    }
}
