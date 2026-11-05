using Microsoft.EntityFrameworkCore;
using Pods.Application.Common.Interfaces;
using Pods.Application.Common.Models;
using Pods.Application.DTOs;
using Pods.Application.Interfaces;
using Pods.Domain.Entities;
using Pods.Domain.Enums;

namespace Pods.Application.Services;

public class CheckInService : ICheckInService
{
    private readonly IApplicationDbContext _context;
    private readonly IStreakCalculationService _streakService;
    private readonly IAzureBlobStorageService _blobService;

    public CheckInService(
        IApplicationDbContext context,
        IStreakCalculationService streakService,
        IAzureBlobStorageService blobService)
    {
        _context = context;
        _streakService = streakService;
        _blobService = blobService;
    }

    public async Task<ServiceResult<CheckInDto>> SubmitCheckInAsync(SubmitCheckInDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var commitment = await _context.Commitments
            .Include(c => c.Group)
            .FirstOrDefaultAsync(c => c.Id == dto.CommitmentId && c.UserId == userId, cancellationToken);

        if (commitment == null)
            return ServiceResult<CheckInDto>.Failure("Commitment not found or unauthorized.");

        var checkIn = commitment.RecordCheckIn(dto.Notes);

        if (!string.IsNullOrEmpty(dto.EvidenceFileBase64) && !string.IsNullOrEmpty(dto.EvidenceFileName))
        {
            var bytes = Convert.FromBase64String(dto.EvidenceFileBase64);
            using var stream = new MemoryStream(bytes);
            var fileUrl = await _blobService.UploadFileAsync(
                stream,
                $"{Guid.NewGuid()}_{dto.EvidenceFileName}",
                dto.EvidenceContentType ?? "application/octet-stream",
                "proofs",
                cancellationToken
            );

            checkIn.AddProof(fileUrl, dto.EvidenceContentType ?? "image/jpeg", bytes.Length);
        }

        await _context.SaveChangesAsync(cancellationToken);

        if (checkIn.Status == CheckInStatus.Verified)
        {
            await _streakService.UpdateStreakOnCheckInAsync(userId, commitment.Id, checkIn.CheckInTimestampUtc, cancellationToken);
        }

        var user = await _context.UserProfiles.FindAsync(new object[] { userId }, cancellationToken);

        var result = new CheckInDto(
            checkIn.Id,
            commitment.Id,
            commitment.Title,
            userId,
            user?.DisplayName ?? "User",
            checkIn.CheckInTimestampUtc,
            checkIn.Notes,
            checkIn.Status,
            checkIn.VerificationMethod,
            checkIn.Proofs.Select(p => p.FileUrl).ToList(),
            checkIn.RejectionReason
        );

        return ServiceResult<CheckInDto>.Success(result);
    }

    public async Task<ServiceResult<bool>> ReviewCheckInAsync(Guid checkInId, Guid reviewerUserId, ReviewCheckInDto dto, CancellationToken cancellationToken = default)
    {
        var checkIn = await _context.CheckIns
            .Include(c => c.Commitment)
                .ThenInclude(c => c.Group)
                    .ThenInclude(g => g.Memberships)
            .FirstOrDefaultAsync(c => c.Id == checkInId, cancellationToken);

        if (checkIn == null)
            return ServiceResult<bool>.Failure("Check-in not found.");

        var reviewerMembership = checkIn.Commitment.Group.Memberships
            .FirstOrDefault(m => m.UserId == reviewerUserId && m.IsActive);

        if (reviewerMembership == null || reviewerMembership.Role == GroupRole.Member)
            return ServiceResult<bool>.Failure("Only group moderators or creators can review peer check-ins.");

        if (dto.Approved)
        {
            checkIn.Verify(reviewerUserId);
            await _streakService.UpdateStreakOnCheckInAsync(checkIn.UserId, checkIn.CommitmentId, checkIn.CheckInTimestampUtc, cancellationToken);
        }
        else
        {
            checkIn.Reject(reviewerUserId, dto.RejectionReason ?? "Evidence did not meet verification criteria.");
        }

        await _context.SaveChangesAsync(cancellationToken);
        return ServiceResult<bool>.Success(true);
    }

    public async Task<ServiceResult<List<CheckInDto>>> GetPendingReviewsForGroupAsync(Guid groupId, Guid reviewerUserId, CancellationToken cancellationToken = default)
    {
        var pendingCheckIns = await _context.CheckIns
            .Include(c => c.Commitment)
            .Include(c => c.User)
            .Include(c => c.Proofs)
            .Where(c => c.Commitment.GroupId == groupId && c.Status == CheckInStatus.PendingReview)
            .OrderByDescending(c => c.CheckInTimestampUtc)
            .ToListAsync(cancellationToken);

        var dtos = pendingCheckIns.Select(c => new CheckInDto(
            c.Id,
            c.CommitmentId,
            c.Commitment?.Title ?? "Commitment",
            c.UserId,
            c.User?.DisplayName ?? "User",
            c.CheckInTimestampUtc,
            c.Notes,
            c.Status,
            c.VerificationMethod,
            c.Proofs.Select(p => p.FileUrl).ToList(),
            c.RejectionReason
        )).ToList();

        return ServiceResult<List<CheckInDto>>.Success(dtos);
    }
}
