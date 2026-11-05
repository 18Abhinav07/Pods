using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Pods.API.Middleware;
using Pods.Application.Common.Interfaces;
using Pods.Application.Interfaces;
using Pods.Application.Services;
using Pods.Application.Validators;
using Pods.Infrastructure.Persistence;
using Pods.Infrastructure.Persistence.SqlQueries;
using Pods.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Database Configuration (EF Core + SQL Server)
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
        ?? "Server=(localdb)\\mssqllocaldb;Database=PodsDb;Trusted_Connection=True;MultipleActiveResultSets=true";
    options.UseSqlServer(connectionString);
});

builder.Services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());

// 2. Application & Domain Services
builder.Services.AddScoped<IAccountabilityGroupService, AccountabilityGroupService>();
builder.Services.AddScoped<ICommitmentService, CommitmentService>();
builder.Services.AddScoped<ICheckInService, CheckInService>();
builder.Services.AddScoped<IStreakCalculationService, StreakCalculationService>();
builder.Services.AddScoped<IProgressAnalyticsRawSqlService, ProgressAnalyticsRawSqlService>();

// 3. Azure Cloud & AI Integrations
builder.Services.AddSingleton<IAzureBlobStorageService, AzureBlobStorageService>();
builder.Services.AddHttpClient<IAiCoachingService, AzureOpenAiCoachingService>();

// 4. FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<CreateGroupValidator>();

// 5. MVC with Razor Views & Web API Controllers
builder.Services.AddControllersWithViews()
    .AddRazorRuntimeCompilation();

// 6. Swagger OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Pods Accountability API", Version = "v1", Description = "Enterprise .NET Core / ASP.NET MVC backend for habit tracking and group accountability." });
});

var app = builder.Build();

// Configure Middleware Pipeline
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Pods API v1"));
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();

// Route MVC Views and API Controllers
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Dashboard}/{action=Index}/{id?}");

app.MapControllers();

app.Run();
