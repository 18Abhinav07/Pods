using Microsoft.AspNetCore.Mvc;
using Pods.Application.DTOs;
using Pods.Application.Interfaces;

namespace Pods.API.Controllers.Mvc;

public class GroupsMvcController : Controller
{
    private readonly IAccountabilityGroupService _groupService;

    public GroupsMvcController(IAccountabilityGroupService groupService)
    {
        _groupService = groupService;
    }

    public async Task<IActionResult> Index()
    {
        var result = await _groupService.GetPublicGroupsAsync();
        return View(result.Data);
    }

    public IActionResult Create()
    {
        return View(new CreateGroupDto(string.Empty, string.Empty, "Engineering", 12, false));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(CreateGroupDto model)
    {
        if (!ModelState.IsValid)
        {
            return View(model);
        }

        // Demo creator guid
        var demoUserId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var result = await _groupService.CreateGroupAsync(model, demoUserId);

        if (!result.Succeeded)
        {
            ModelState.AddModelError(string.Empty, result.ErrorMessage ?? "Failed to create group.");
            return View(model);
        }

        return RedirectToAction(nameof(Details), new { id = result.Data!.Id });
    }

    public async Task<IActionResult> Details(Guid id)
    {
        var result = await _groupService.GetGroupByIdAsync(id);
        if (!result.Succeeded) return NotFound();
        return View(result.Data);
    }
}
