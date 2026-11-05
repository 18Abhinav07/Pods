using Microsoft.EntityFrameworkCore;
using Pods.Application.Common.Interfaces;
using Pods.Application.Common.Models;
using Pods.Application.DTOs;
using Pods.Application.Interfaces;
using Pods.Domain.Entities;
using Pods.Domain.Enums;

namespace Pods.Application.Services;

public class AccountabilityGroupService : IAccountabilityGroupService
{
    private readonly IApplicationDbContext _context;

    public AccountabilityGroupService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResult<GroupDetailDto>> CreateGroupAsync(CreateGroupDto dto, Guid creatorUserId, CancellationToken cancellationToken = default)
    {
        var slug = dto.Name.ToLowerInvariant().Replace(" ", "-");
        var existingSlug = await _context.AccountabilityGroups.AnyAsync(g => g.Slug == slug, cancellationToken);
        if (existingSlug)
        {
            slug = $"{slug}-{Guid.NewGuid().ToString()[..6]}";
        }

        var group = new AccountabilityGroup(
            dto.Name,
            slug,
            dto.Description,
            dto.Category,
            creatorUserId,
            dto.MaxMembers,
            dto.IsPrivate
        );

        _context.AccountabilityGroups.Add(group);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetGroupByIdAsync(group.Id, cancellationToken);
    }

    public async Task<ServiceResult<List<GroupSummaryDto>>> GetPublicGroupsAsync(CancellationToken cancellationToken = default)
    {
        var groups = await _context.AccountabilityGroups
            .Include(g => g.Memberships)
            .Where(g => !g.IsPrivate && !g.IsDeleted)
            .Select(g => new GroupSummaryDto(
                g.Id,
                g.Name,
                g.Slug,
                g.Description,
                g.Category,
                g.Memberships.Count(m => m.IsActive),
                g.MaxMembers,
                g.IsPrivate
            ))
            .ToListAsync(cancellationToken);

        return ServiceResult<List<GroupSummaryDto>>.Success(groups);
    }

    public async Task<ServiceResult<GroupDetailDto>> GetGroupByIdAsync(Guid groupId, CancellationToken cancellationToken = default)
    {
        var group = await _context.AccountabilityGroups
            .Include(g => g.Memberships)
                .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(g => g.Id == groupId && !g.IsDeleted, cancellationToken);

        if (group == null)
            return ServiceResult<GroupDetailDto>.Failure("Accountability group not found.");

        var members = group.Memberships
            .Where(m => m.IsActive)
            .Select(m => new GroupMemberDto(
                m.UserId,
                m.User?.DisplayName ?? "Member",
                m.User?.Username ?? "user",
                m.User?.AvatarUrl,
                m.Role,
                m.JoinedAtUtc
            ))
            .ToList();

        var detail = new GroupDetailDto(
            group.Id,
            group.Name,
            group.Slug,
            group.Description,
            group.Category,
            group.CreatorId,
            group.MaxMembers,
            group.IsPrivate,
            group.InviteCode,
            members
        );

        return ServiceResult<GroupDetailDto>.Success(detail);
    }

    public async Task<ServiceResult<bool>> JoinGroupAsync(Guid groupId, Guid userId, string? inviteCode = null, CancellationToken cancellationToken = default)
    {
        var group = await _context.AccountabilityGroups
            .Include(g => g.Memberships)
            .FirstOrDefaultAsync(g => g.Id == groupId, cancellationToken);

        if (group == null)
            return ServiceResult<bool>.Failure("Group not found.");

        if (group.IsPrivate && group.InviteCode != inviteCode)
            return ServiceResult<bool>.Failure("Invalid invite code for this private group.");

        try
        {
            group.AddMember(userId, GroupRole.Member);
            await _context.SaveChangesAsync(cancellationToken);
            return ServiceResult<bool>.Success(true);
        }
        catch (Exception ex)
        {
            return ServiceResult<bool>.Failure(ex.Message);
        }
    }

    public async Task<ServiceResult<bool>> LeaveGroupAsync(Guid groupId, Guid userId, CancellationToken cancellationToken = default)
    {
        var group = await _context.AccountabilityGroups
            .Include(g => g.Memberships)
            .FirstOrDefaultAsync(g => g.Id == groupId, cancellationToken);

        if (group == null)
            return ServiceResult<bool>.Failure("Group not found.");

        try
        {
            group.RemoveMember(userId);
            await _context.SaveChangesAsync(cancellationToken);
            return ServiceResult<bool>.Success(true);
        }
        catch (Exception ex)
        {
            return ServiceResult<bool>.Failure(ex.Message);
        }
    }
}
