using Microsoft.AspNetCore.Mvc;
using Pods.Application.DTOs;
using Pods.Application.Interfaces;

namespace Pods.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CommitmentsController : ControllerBase
{
    private readonly ICommitmentService _commitmentService;

    public CommitmentsController(ICommitmentService commitmentService)
    {
        _commitmentService = commitmentService;
    }

    [HttpGet("user/{userId:guid}")]
    public async Task<IActionResult> GetUserCommitments(Guid userId, CancellationToken cancellationToken)
    {
        var result = await _commitmentService.GetUserCommitmentsAsync(userId, cancellationToken);
        return Ok(result.Data);
    }

    [HttpGet("group/{groupId:guid}")]
    public async Task<IActionResult> GetGroupCommitments(Guid groupId, CancellationToken cancellationToken)
    {
        var result = await _commitmentService.GetGroupCommitmentsAsync(groupId, cancellationToken);
        return Ok(result.Data);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCommitment([FromBody] CreateCommitmentDto dto, [FromQuery] Guid userId, CancellationToken cancellationToken)
    {
        var result = await _commitmentService.CreateCommitmentAsync(dto, userId, cancellationToken);
        if (!result.Succeeded) return BadRequest(result.ErrorMessage);
        return Ok(result.Data);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromQuery] Guid userId, [FromBody] UpdateCommitmentStatusDto dto, CancellationToken cancellationToken)
    {
        var result = await _commitmentService.UpdateStatusAsync(id, userId, dto, cancellationToken);
        if (!result.Succeeded) return BadRequest(result.ErrorMessage);
        return Ok(new { success = true });
    }
}
