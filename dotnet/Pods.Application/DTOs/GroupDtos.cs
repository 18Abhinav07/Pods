using Pods.Domain.Enums;

namespace Pods.Application.DTOs;

public record CreateGroupDto(string Name, string Description, string Category, int MaxMembers, bool IsPrivate);
public record GroupSummaryDto(Guid Id, string Name, string Slug, string Description, string Category, int ActiveMembersCount, int MaxMembers, bool IsPrivate);
public record GroupDetailDto(Guid Id, string Name, string Slug, string Description, string Category, Guid CreatorId, int MaxMembers, bool IsPrivate, string? InviteCode, List<GroupMemberDto> Members);
public record GroupMemberDto(Guid UserId, string DisplayName, string Username, string? AvatarUrl, GroupRole Role, DateTime JoinedAtUtc);
