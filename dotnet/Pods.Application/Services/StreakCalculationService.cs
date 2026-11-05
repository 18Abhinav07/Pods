using Microsoft.EntityFrameworkCore;
using Pods.Application.Common.Interfaces;
using Pods.Application.Interfaces;
using Pods.Domain.Entities;

namespace Pods.Application.Services;

public class StreakCalculationService : IStreakCalculationService
{
    private readonly IApplicationDbContext _context;

    public StreakCalculationService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<StreakRecord> UpdateStreakOnCheckInAsync(Guid userId, Guid commitmentId, DateTime checkInDateUtc, CancellationToken cancellationToken = default)
    {
        var streak = await _context.StreakRecords
            .FirstOrDefaultAsync(s => s.UserId == userId && s.CommitmentId == commitmentId, cancellationToken);

        if (streak == null)
        {
            streak = new StreakRecord(userId, commitmentId);
            _context.StreakRecords.Add(streak);
        }

        streak.RecordSuccessfulCheckIn(checkInDateUtc);
        await _context.SaveChangesAsync(cancellationToken);
        return streak;
    }

    public async Task ReconcileAllStreaksAsync(DateTime currentUtcDate, CancellationToken cancellationToken = default)
    {
        var activeStreaks = await _context.StreakRecords
            .Where(s => s.CurrentStreakDays > 0)
            .ToListAsync(cancellationToken);

        foreach (var streak in activeStreaks)
        {
            streak.ResetStreakIfBroken(currentUtcDate);
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
