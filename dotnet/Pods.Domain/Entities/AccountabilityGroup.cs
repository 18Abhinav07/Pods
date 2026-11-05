using Pods.Domain.Common;
using Pods.Domain.Enums;
using Pods.Domain.Exceptions;

namespace Pods.Domain.Entities;

public class AccountabilityGroup : BaseEntity, IAggregateRoot
{
    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string Category { get; private set; } = string.Empty;
    public Guid CreatorId { get; private set; }
    public int MaxMembers { get; private set; } = 12;
    public bool IsPrivate { get; private set; } = false;
    public string? InviteCode { get; private set; }

    private readonly List<GroupMembership> _memberships = new();
    public IReadOnlyCollection<GroupMembership> Memberships => _memberships.AsReadOnly();

    private readonly List<Commitment> _commitments = new();
    public IReadOnlyCollection<Commitment> Commitments => _commitments.AsReadOnly();

    protected AccountabilityGroup() { }

    public AccountabilityGroup(string name, string slug, string description, string category, Guid creatorId, int maxMembers = 12, bool isPrivate = false)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainRuleViolationException("Group name cannot be empty.");

        Name = name;
        Slug = slug.ToLowerInvariant().Trim();
        Description = description;
        Category = category;
        CreatorId = creatorId;
        MaxMembers = maxMembers;
        IsPrivate = isPrivate;
        InviteCode = isPrivate ? Guid.NewGuid().ToString("N")[..8].ToUpperInvariant() : null;

        _memberships.Add(new GroupMembership(Id, creatorId, GroupRole.Creator));
    }

    public void AddMember(Guid userId, GroupRole role = GroupRole.Member)
    {
        if (_memberships.Count(m => m.IsActive) >= MaxMembers)
            throw new DomainRuleViolationException($"Accountability group is at maximum capacity of {MaxMembers} members.");

        var existing = _memberships.FirstOrDefault(m => m.UserId == userId);
        if (existing != null)
        {
            if (existing.IsActive)
                throw new DomainRuleViolationException("User is already an active member of this group.");
            existing.Reactivate(role);
        }
        else
        {
            _memberships.Add(new GroupMembership(Id, userId, role));
        }

        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void RemoveMember(Guid userId)
    {
        var membership = _memberships.FirstOrDefault(m => m.UserId == userId && m.IsActive);
        if (membership == null)
            throw new DomainRuleViolationException("Member does not belong to this group.");

        if (membership.Role == GroupRole.Creator && _memberships.Count(m => m.IsActive && m.Role == GroupRole.Creator) <= 1)
            throw new DomainRuleViolationException("Cannot remove the sole creator of the group.");

        membership.Deactivate();
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
