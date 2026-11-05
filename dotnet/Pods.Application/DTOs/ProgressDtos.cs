namespace Pods.Application.DTOs;

public record UserProgressOverviewDto(
    Guid UserId,
    string DisplayName,
    int TotalActiveCommitments,
    int OverallCurrentStreak,
    int LongestStreakEver,
    int TotalCompletedCheckInsThisMonth,
    double MonthlyCompletionRatePercentage,
    List<CommitmentProgressDto> Commitments
);

public record CommitmentProgressDto(
    Guid CommitmentId,
    string Title,
    string Frequency,
    int CurrentStreak,
    int LongestStreak,
    int CheckInsThisWeek,
    int TargetThisWeek,
    bool CompletedToday
);

public record GroupLeaderboardDto(
    Guid GroupId,
    string GroupName,
    List<LeaderboardMemberDto> Members
);

public record LeaderboardMemberDto(
    Guid UserId,
    string DisplayName,
    int CurrentStreak,
    int CompletedCheckIns,
    decimal ReputationScore,
    int Rank
);
