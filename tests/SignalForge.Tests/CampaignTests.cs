using SignalForge.Domain;

namespace SignalForge.Tests;

public sealed class CampaignTests
{
    [Fact]
    public void CreateWithValidInputProducesDraftCampaign()
    {
        var campaign = Campaign.Create("Renewal journey", "Email", "Annual customers", 25_000);

        Assert.Equal(CampaignStatus.Draft, campaign.Status);
        Assert.Equal(25_000, campaign.TargetVolume);
        Assert.Equal(0, campaign.Processed);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(10_000_001)]
    public void CreateWithInvalidVolumeRejectsInput(int targetVolume)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            Campaign.Create("Renewal journey", "Email", "Annual customers", targetVolume));
    }

    [Fact]
    public void PauseWhenDraftRejectsTransition()
    {
        var campaign = Campaign.Create("Renewal journey", "Email", "Annual customers", 25_000);

        Assert.Throws<InvalidOperationException>(campaign.Pause);
    }

    [Fact]
    public void RecordBatchUpdatesDeliveryMetrics()
    {
        var campaign = Campaign.Create("Renewal journey", "Email", "Annual customers", 25_000);
        campaign.Launch();

        campaign.RecordBatch(990, 10);

        Assert.Equal(1_000, campaign.Processed);
        Assert.Equal(99, campaign.DeliveryRate);
        Assert.Equal(CampaignStatus.Live, campaign.Status);
    }

    [Fact]
    public void RecordBatchWhenTargetIsReachedCompletesCampaign()
    {
        var campaign = Campaign.Create("Renewal journey", "Email", "Annual customers", 1_000);
        campaign.Launch();

        campaign.RecordBatch(995, 5);

        Assert.Equal(CampaignStatus.Completed, campaign.Status);
        Assert.Throws<InvalidOperationException>(campaign.Launch);
    }
}
