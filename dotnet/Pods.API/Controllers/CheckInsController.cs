using Microsoft.AspNetCore.Mvc;
using Pods.Application.DTOs;
using Pods.Application.Interfaces;

namespace Pods.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CheckInsController : ControllerBase
{
    private readonly ICheckInService _checkInService;

    public CheckInsController(ICheckInService checkInService)
    {
        _checkInService = checkInService;
    }

    [HttpPost]
    public async Task<IActionResult> SubmitCheckIn([FromBody] SubmitCheckInDto dto, [FromQuery] Guid userId, CancellationToken cancellationToken)
    {
        var result = await _checkInService.SubmitCheckInAsync(dto, userId, cancellationToken);
        if (!result.Succeeded) return BadRequest(result.ErrorMessage);
        return Ok(result.Data);
    }

    [HttpPost("{id:guid}/review")]
    public async Task<IActionResult> ReviewCheckIn(Guid id, [FromQuery] Guid reviewerUserId, [FromBody] ReviewCheckInDto dto, CancellationToken cancellationToken)
    {
        var result = await _checkInService.ReviewCheckInAsync(id, reviewerUserId, dto, cancellationToken);
        if (!result.Succeeded) return BadRequest(result.ErrorMessage);
        return Ok(new { success = true });
    }

    [HttpGet("group/{groupId:guid}/pending")]
    public async Task<IActionResult> GetPendingReviews(Guid groupId, [FromQuery] Guid reviewerUserId, CancellationToken cancellationToken)
    {
        var result = await _checkInService.GetPendingReviewsForGroupAsync(groupId, reviewerUserId, cancellationToken);
        return Ok(result.Data);
    }
}
