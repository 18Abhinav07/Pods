using Pods.Domain.Entities;

namespace Pods.Application.Interfaces;

public interface IStreakCalculationService
{
    Task<StreakRecord> UpdateStreakOnCheckInAsync(Guid userId, Guid commitmentId, DateTime checkInDateUtc, CancellationToken cancellationToken = default);
    Task ReconcileAllStreaksAsync(DateTime currentUtcDate, CancellationToken cancellationToken = default);
}
