using Microsoft.AspNetCore.Mvc;
using Pods.Application.DTOs;
using Pods.Application.Interfaces;

namespace Pods.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccountabilityGroupsController : ControllerBase
{
    private readonly IAccountabilityGroupService _groupService;

    public AccountabilityGroupsController(IAccountabilityGroupService groupService)
    {
        _groupService = groupService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<GroupSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPublicGroups(CancellationToken cancellationToken)
    {
        var result = await _groupService.GetPublicGroupsAsync(cancellationToken);
        return Ok(result.Data);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(GroupDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetGroupById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _groupService.GetGroupByIdAsync(id, cancellationToken);
        if (!result.Succeeded) return NotFound(result.ErrorMessage);
        return Ok(result.Data);
    }

    [HttpPost]
    [ProducesResponseType(typeof(GroupDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateGroup([FromBody] CreateGroupDto dto, [FromQuery] Guid userId, CancellationToken cancellationToken)
    {
        var result = await _groupService.CreateGroupAsync(dto, userId, cancellationToken);
        if (!result.Succeeded) return BadRequest(result.ErrorMessage);
        return CreatedAtAction(nameof(GetGroupById), new { id = result.Data!.Id }, result.Data);
    }

    [HttpPost("{id:guid}/join")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> JoinGroup(Guid id, [FromQuery] Guid userId, [FromQuery] string? inviteCode, CancellationToken cancellationToken)
    {
        var result = await _groupService.JoinGroupAsync(id, userId, inviteCode, cancellationToken);
        if (!result.Succeeded) return BadRequest(result.ErrorMessage);
        return Ok(new { success = true });
    }
}
