using Microsoft.AspNetCore.Mvc;
using Pods.Application.Interfaces;
using Pods.Infrastructure.Persistence.SqlQueries;

namespace Pods.API.Controllers.Mvc;

public class DashboardController : Controller
{
    private readonly IProgressAnalyticsRawSqlService _sqlAnalytics;
    private readonly IAccountabilityGroupService _groupService;

    public DashboardController(
        IProgressAnalyticsRawSqlService sqlAnalytics,
        IAccountabilityGroupService groupService)
    {
        _sqlAnalytics = sqlAnalytics;
        _groupService = groupService;
    }

    public async Task<IActionResult> Index()
    {
        // Demo dashboard loading high-level metrics
        var publicGroups = await _groupService.GetPublicGroupsAsync();
        ViewBag.PublicGroups = publicGroups.Data;
        return View();
    }
}
