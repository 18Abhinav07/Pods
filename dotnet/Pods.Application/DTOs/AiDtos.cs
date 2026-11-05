namespace Pods.Application.DTOs;

public record AiCoachingFeedbackDto(
    string Summary,
    string MotivationalMessage,
    List<string> RecommendedAdjustments,
    List<string> RiskFactors,
    double PredictedSuccessScore
);

public record AiGoalBreakdownDto(
    string GoalTitle,
    string HighLevelStrategy,
    List<MilestoneItemDto> RecommendedMilestones
);

public record MilestoneItemDto(int DayNumber, string ActionableTitle, string VerificationHint);
