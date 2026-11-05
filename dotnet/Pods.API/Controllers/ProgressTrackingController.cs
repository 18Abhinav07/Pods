using Microsoft.AspNetCore.Mvc;
using Pods.Infrastructure.Persistence.SqlQueries;

namespace Pods.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProgressTrackingController : ControllerBase
{
    private readonly IProgressAnalyticsRawSqlService _rawSqlService;

    public ProgressTrackingController(IProgressAnalyticsRawSqlService rawSqlService)
    {
        _rawSqlService = rawSqlService;
    }

    [HttpGet("user/{userId:guid}")]
    public async Task<IActionResult> GetUserProgress(Guid userId, CancellationToken cancellationToken)
    {
        var result = await _rawSqlService.GetUserMonthlyProgressAnalyticsAsync(userId, cancellationToken);
        if (result == null) return NotFound("User analytics not found.");
        return Ok(result);
    }

    [HttpGet("leaderboard/{groupId:guid}")]
    public async Task<IActionResult> GetGroupLeaderboard(Guid groupId, CancellationToken cancellationToken)
    {
        var rankings = await _rawSqlService.GetGroupLeaderboardRankingsAsync(groupId, cancellationToken);
        return Ok(rankings);
    }
}
