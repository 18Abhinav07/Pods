using Microsoft.AspNetCore.Mvc;
using Pods.Application.Common.Interfaces;

namespace Pods.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AiAdvisorController : ControllerBase
{
    private readonly IAiCoachingService _aiService;

    public AiAdvisorController(IAiCoachingService aiService)
    {
        _aiService = aiService;
    }

    [HttpGet("coaching/{userId:guid}")]
    public async Task<IActionResult> GetWeeklyCoaching(Guid userId, CancellationToken cancellationToken)
    {
        var advice = await _aiService.GenerateWeeklyAdviceAsync(userId, cancellationToken);
        return Ok(advice);
    }

    [HttpPost("decompose-goal")]
    public async Task<IActionResult> DecomposeGoal([FromQuery] string goal, [FromQuery] int targetDays, CancellationToken cancellationToken)
    {
        var breakdown = await _aiService.BreakDownGoalAsync(goal, targetDays, cancellationToken);
        return Ok(breakdown);
    }
}
