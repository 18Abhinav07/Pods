using Pods.Domain.Common;
using Pods.Domain.Enums;

namespace Pods.Domain.Entities;

public class GroupMembership : BaseEntity
{
    public Guid GroupId { get; private set; }
    public Guid UserId { get; private set; }
    public GroupRole Role { get; private set; }
    public bool IsActive { get; private set; } = true;
    public DateTime JoinedAtUtc { get; private set; } = DateTime.UtcNow;

    public AccountabilityGroup Group { get; private set; } = null!;
    public UserProfile User { get; private set; } = null!;

    protected GroupMembership() { }

    public GroupMembership(Guid groupId, Guid userId, GroupRole role)
    {
        GroupId = groupId;
        UserId = userId;
        Role = role;
        IsActive = true;
        JoinedAtUtc = DateTime.UtcNow;
    }

    public void Reactivate(GroupRole role)
    {
        Role = role;
        IsActive = true;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
