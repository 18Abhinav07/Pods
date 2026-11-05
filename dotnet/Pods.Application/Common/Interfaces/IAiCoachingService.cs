using Pods.Application.DTOs;

namespace Pods.Application.Common.Interfaces;

public interface IAiCoachingService
{
    Task<AiCoachingFeedbackDto> GenerateWeeklyAdviceAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<AiGoalBreakdownDto> BreakDownGoalAsync(string goalDescription, int targetDays, CancellationToken cancellationToken = default);
}
