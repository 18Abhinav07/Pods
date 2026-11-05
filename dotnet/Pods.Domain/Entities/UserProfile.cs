using Pods.Domain.Common;

namespace Pods.Domain.Entities;

public class UserProfile : BaseEntity, IAggregateRoot
{
    public string ExternalUserId { get; private set; } = string.Empty;
    public string Username { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string DisplayName { get; private set; } = string.Empty;
    public string? AvatarUrl { get; private set; }
    public string TimeZone { get; private set; } = "UTC";
    public decimal ReputationScore { get; private set; } = 100.0m;

    private readonly List<GroupMembership> _memberships = new();
    public IReadOnlyCollection<GroupMembership> Memberships => _memberships.AsReadOnly();

    private readonly List<Commitment> _commitments = new();
    public IReadOnlyCollection<Commitment> Commitments => _commitments.AsReadOnly();

    private readonly List<StreakRecord> _streaks = new();
    public IReadOnlyCollection<StreakRecord> Streaks => _streaks.AsReadOnly();

    protected UserProfile() { }

    public UserProfile(string externalUserId, string username, string email, string displayName, string? timeZone = "UTC")
    {
        ExternalUserId = externalUserId ?? throw new ArgumentNullException(nameof(externalUserId));
        Username = username ?? throw new ArgumentNullException(nameof(username));
        Email = email ?? throw new ArgumentNullException(nameof(email));
        DisplayName = displayName ?? username;
        TimeZone = timeZone ?? "UTC";
    }

    public void UpdateProfile(string displayName, string? avatarUrl, string timeZone)
    {
        DisplayName = displayName;
        AvatarUrl = avatarUrl;
        TimeZone = timeZone;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void AdjustReputation(decimal delta)
    {
        ReputationScore = Math.Max(0, ReputationScore + delta);
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
