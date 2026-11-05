using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Pods.Application.Coaching;
using Pods.Application.Common.Interfaces;
using Pods.Application.DTOs;

namespace Pods.Infrastructure.Services;

/// <summary>
/// Weekly coaching backed by Azure OpenAI. The prompt carries a snapshot of the user's
/// real commitments, check-ins and streaks. When the model is not configured, or the call
/// fails or returns something unparseable, the same snapshot goes through
/// <see cref="CoachingHeuristics"/> so the endpoint always answers from data.
/// </summary>
public class AzureOpenAiCoachingService : IAiCoachingService
{
    private const string ApiVersion = "2024-06-01";
    private static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true };

    private readonly HttpClient _httpClient;
    private readonly IApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AzureOpenAiCoachingService> _logger;

    public AzureOpenAiCoachingService(
        HttpClient httpClient,
        IApplicationDbContext context,
        IConfiguration configuration,
        ILogger<AzureOpenAiCoachingService> logger)
    {
        _httpClient = httpClient;
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<AiCoachingFeedbackDto> GenerateWeeklyAdviceAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var since = now.Date.AddDays(-7);

        var commitments = await _context.Commitments.AsNoTracking()
            .Where(c => c.UserId == userId && !c.IsDeleted).ToListAsync(cancellationToken);
        var checkIns = await _context.CheckIns.AsNoTracking()
            .Where(c => c.UserId == userId && c.CheckInTimestampUtc >= since).ToListAsync(cancellationToken);
        var streaks = await _context.StreakRecords.AsNoTracking()
            .Where(s => s.UserId == userId).ToListAsync(cancellationToken);

        var snapshot = CoachingHeuristics.BuildSnapshot(userId, commitments, checkIns, streaks, now);

        var system = "You are an accountability coach. Use only the numbers in the snapshot; do not invent facts. " +
                     "Reply with a JSON object with keys Summary (string), MotivationalMessage (string), " +
                     "RecommendedAdjustments (string[]), RiskFactors (string[]), PredictedSuccessScore (number 0 to 100).";
        var user = $"Snapshot of the last 7 days: {JsonSerializer.Serialize(snapshot)}";

        var fromModel = await CompleteJsonAsync<AiCoachingFeedbackDto>(system, user, cancellationToken);
        return fromModel is { Summary.Length: > 0 } ? fromModel : CoachingHeuristics.Evaluate(snapshot);
    }

    public async Task<AiGoalBreakdownDto> BreakDownGoalAsync(string goalDescription, int targetDays, CancellationToken cancellationToken = default)
    {
        var baseline = CoachingHeuristics.BreakDownGoal(goalDescription, targetDays);

        var system = "You plan habit goals. Reply with a JSON object with keys GoalTitle (string), HighLevelStrategy (string), " +
                     "RecommendedMilestones (array of { DayNumber, ActionableTitle, VerificationHint }). " +
                     $"Every DayNumber must be between 1 and {targetDays}.";
        var user = $"Goal: {goalDescription.Trim()}. Duration: {targetDays} days.";

        var fromModel = await CompleteJsonAsync<AiGoalBreakdownDto>(system, user, cancellationToken);
        var valid = fromModel?.RecommendedMilestones is { Count: > 0 } m && m.All(x => x.DayNumber >= 1 && x.DayNumber <= targetDays);
        return valid ? fromModel! : baseline;
    }

    private async Task<T?> CompleteJsonAsync<T>(string system, string user, CancellationToken cancellationToken) where T : class
    {
        var endpoint = _configuration["AzureOpenAI:Endpoint"];
        var apiKey = _configuration["AzureOpenAI:ApiKey"];
        var deployment = _configuration["AzureOpenAI:Deployment"] ?? "gpt-4o";

        if (string.IsNullOrWhiteSpace(endpoint) || string.IsNullOrWhiteSpace(apiKey))
            return null;

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post,
                $"{endpoint.TrimEnd('/')}/openai/deployments/{deployment}/chat/completions?api-version={ApiVersion}");
            request.Headers.Add("api-key", apiKey);
            request.Content = JsonContent.Create(new
            {
                messages = new[] { new { role = "system", content = system }, new { role = "user", content = user } },
                temperature = 0.3,
                response_format = new { type = "json_object" }
            });

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Azure OpenAI returned {Status}; using the heuristic result", (int)response.StatusCode);
                return null;
            }

            using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
            var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
            return string.IsNullOrWhiteSpace(content) ? null : JsonSerializer.Deserialize<T>(content, Json);
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException or KeyNotFoundException or InvalidOperationException or TaskCanceledException && !cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning(ex, "Azure OpenAI call failed; using the heuristic result");
            return null;
        }
    }
}
