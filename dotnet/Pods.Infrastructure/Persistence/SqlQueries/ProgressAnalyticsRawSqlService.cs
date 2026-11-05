using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Pods.Application.DTOs;

namespace Pods.Infrastructure.Persistence.SqlQueries;

public interface IProgressAnalyticsRawSqlService
{
    Task<List<LeaderboardMemberDto>> GetGroupLeaderboardRankingsAsync(Guid groupId, CancellationToken cancellationToken = default);
    Task<UserProgressOverviewDto?> GetUserMonthlyProgressAnalyticsAsync(Guid userId, CancellationToken cancellationToken = default);
}

public class ProgressAnalyticsRawSqlService : IProgressAnalyticsRawSqlService
{
    private readonly string _connectionString;

    public ProgressAnalyticsRawSqlService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? "Server=(localdb)\\mssqllocaldb;Database=PodsDb;Trusted_Connection=True;MultipleActiveResultSets=true";
    }

    private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

    public async Task<List<LeaderboardMemberDto>> GetGroupLeaderboardRankingsAsync(Guid groupId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            WITH MemberStats AS (
                SELECT 
                    u.Id AS UserId,
                    u.DisplayName,
                    u.ReputationScore,
                    COALESCE(MAX(s.CurrentStreakDays), 0) AS CurrentStreak,
                    COUNT(ci.Id) AS CompletedCheckIns
                FROM GroupMemberships gm
                INNER JOIN UserProfiles u ON gm.UserId = u.Id
                LEFT JOIN Commitments c ON c.GroupId = gm.GroupId AND c.UserId = u.Id AND c.IsDeleted = 0
                LEFT JOIN StreakRecords s ON s.CommitmentId = c.Id AND s.UserId = u.Id
                LEFT JOIN CheckIns ci ON ci.CommitmentId = c.Id AND ci.Status = 1
                WHERE gm.GroupId = @GroupId AND gm.IsActive = 1
                GROUP BY u.Id, u.DisplayName, u.ReputationScore
            )
            SELECT 
                UserId,
                DisplayName,
                CurrentStreak,
                CompletedCheckIns,
                ReputationScore,
                DENSE_RANK() OVER (ORDER BY CurrentStreak DESC, CompletedCheckIns DESC, ReputationScore DESC) AS [Rank]
            FROM MemberStats
            ORDER BY [Rank] ASC;";

        using var connection = CreateConnection();
        var result = await connection.QueryAsync<LeaderboardMemberDto>(new CommandDefinition(sql, new { GroupId = groupId }, cancellationToken: cancellationToken));
        return result.ToList();
    }

    public async Task<UserProgressOverviewDto?> GetUserMonthlyProgressAnalyticsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        const string summarySql = @"
            SELECT 
                u.Id AS UserId,
                u.DisplayName,
                COUNT(DISTINCT CASE WHEN c.Status = 1 THEN c.Id END) AS TotalActiveCommitments,
                COALESCE(MAX(s.CurrentStreakDays), 0) AS OverallCurrentStreak,
                COALESCE(MAX(s.LongestStreakDays), 0) AS LongestStreakEver,
                COUNT(DISTINCT CASE WHEN ci.Status = 1 AND ci.CheckInTimestampUtc >= DATEADD(day, -30, GETUTCDATE()) THEN ci.Id END) AS TotalCompletedCheckInsThisMonth
            FROM UserProfiles u
            LEFT JOIN Commitments c ON c.UserId = u.Id AND c.IsDeleted = 0
            LEFT JOIN StreakRecords s ON s.UserId = u.Id
            LEFT JOIN CheckIns ci ON ci.UserId = u.Id
            WHERE u.Id = @UserId
            GROUP BY u.Id, u.DisplayName;";

        const string commitmentsSql = @"
            SELECT 
                c.Id AS CommitmentId,
                c.Title,
                CAST(c.Frequency AS VARCHAR(20)) AS Frequency,
                COALESCE(s.CurrentStreakDays, 0) AS CurrentStreak,
                COALESCE(s.LongestStreakDays, 0) AS LongestStreak,
                COUNT(CASE WHEN ci.CheckInTimestampUtc >= DATEADD(day, -7, GETUTCDATE()) AND ci.Status = 1 THEN 1 END) AS CheckInsThisWeek,
                c.TargetCountPerPeriod AS TargetThisWeek,
                CASE WHEN EXISTS (
                    SELECT 1 FROM CheckIns ci2 
                    WHERE ci2.CommitmentId = c.Id 
                    AND CAST(ci2.CheckInTimestampUtc AS DATE) = CAST(GETUTCDATE() AS DATE)
                    AND ci2.Status = 1
                ) THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS CompletedToday
            FROM Commitments c
            LEFT JOIN StreakRecords s ON s.CommitmentId = c.Id
            LEFT JOIN CheckIns ci ON ci.CommitmentId = c.Id
            WHERE c.UserId = @UserId AND c.Status = 1 AND c.IsDeleted = 0
            GROUP BY c.Id, c.Title, c.Frequency, s.CurrentStreakDays, s.LongestStreakDays, c.TargetCountPerPeriod;";

        using var connection = CreateConnection();
        var summary = await connection.QueryFirstOrDefaultAsync<dynamic>(new CommandDefinition(summarySql, new { UserId = userId }, cancellationToken: cancellationToken));
        if (summary == null) return null;

        var commitments = (await connection.QueryAsync<CommitmentProgressDto>(new CommandDefinition(commitmentsSql, new { UserId = userId }, cancellationToken: cancellationToken))).ToList();

        int totalActive = (int)(summary.TotalActiveCommitments ?? 0);
        int completedThisMonth = (int)(summary.TotalCompletedCheckInsThisMonth ?? 0);
        double monthlyCompletionRate = totalActive > 0 ? Math.Min(100.0, (completedThisMonth / (double)(totalActive * 30)) * 100.0) : 0.0;

        return new UserProgressOverviewDto(
            (Guid)summary.UserId,
            (string)summary.DisplayName,
            totalActive,
            (int)(summary.OverallCurrentStreak ?? 0),
            (int)(summary.LongestStreakEver ?? 0),
            completedThisMonth,
            Math.Round(monthlyCompletionRate, 1),
            commitments
        );
    }
}
