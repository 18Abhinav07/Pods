<p align="center">
  <img src="apps/web/public/brand/pods-icon-512.png" width="96" alt="Pods" />
</p>

<h1 align="center">Pods</h1>
<p align="center"><b>Make showing up feel real.</b></p>
<p align="center">Activity-led accountability platform backed by deterministic verification and parallel .NET Clean Architecture.</p>

<p align="center">
  <img src="https://img.shields.io/badge/Language-C%23%2012-blue?logo=csharp" alt="C#" />
  <img src="https://img.shields.io/badge/Platform-.NET%208.0-purple?logo=dotnet" alt=".NET 8" />
  <img src="https://img.shields.io/badge/Framework-ASP.NET%20Core%20%7C%20MVC-512BD4?logo=dotnet" alt="ASP.NET Core MVC" />
  <img src="https://img.shields.io/badge/Database-SQL%20Server%20%26%20EF%20Core-CC292B?logo=microsoftsqlserver" alt="SQL Server" />
  <img src="https://img.shields.io/badge/Cloud-Microsoft%20Azure%20Blob-0078D4?logo=microsoftazure" alt="Azure" />
  <img src="https://img.shields.io/badge/AI-Azure%20OpenAI%20GPT--4o-00A67E?logo=openai" alt="Azure OpenAI" />
  <img src="https://img.shields.io/badge/Testing-xUnit%20%7C%20Moq-2496ED" alt="xUnit" />
</p>

<p align="center">
  <a href="#net-core--aspnet-mvc-architecture">.NET Architecture</a> ·
  <a href="#how-it-works">How It Works</a> ·
  <a href="#proven-on-testnet">Proven on Testnet</a> ·
  <a href="#resume--portfolio-highlights">Resume Alignment</a>
</p>

---

Most accountability apps ask you to trust yourself. Pods asks you to put something real behind it.

Create a Pod, lock commitments behind a fixed schedule of proof, and let transparent peer verification do the work your willpower won't. Everyone in the room can see who showed up, streaks are calculated deterministically, and credit is undeniably logged.

---

## .NET Core & ASP.NET MVC Architecture

Alongside the original prototype, this repository includes a full-featured, parallel enterprise backend implementation located in [`dotnet/`](file:///Users/18abhinav07/Documents/Brain/10-Projects/Pods/Pods-DotnetMigration/dotnet) built with **C# 12, .NET 8, ASP.NET Core Web API, ASP.NET MVC (Razor), Entity Framework Core, SQL Server, and Microsoft Azure Cloud Services**.

### Solution Topology

```
dotnet/
├── Pods.sln
│
├── Pods.API/                              # ASP.NET Core Web API & ASP.NET MVC UI
│   ├── Controllers/                       # REST API endpoints (Groups, Commitments, CheckIns, Analytics)
│   │   ├── AccountabilityGroupsController.cs
│   │   ├── CommitmentsController.cs
│   │   ├── CheckInsController.cs
│   │   ├── ProgressTrackingController.cs
│   │   ├── AiAdvisorController.cs
│   │   └── Mvc/                           # ASP.NET MVC Controllers (Razor Views & Forms)
│   │       ├── DashboardController.cs
│   │       └── GroupsMvcController.cs
│   ├── Views/                             # Razor Views with Model Binding and CSRF Protection
│   │   ├── Shared/_Layout.cshtml
│   │   ├── Dashboard/Index.cshtml
│   │   └── GroupsMvc/Create.cshtml, Details.cshtml
│   ├── wwwroot/js/pods-app.js             # JavaScript client: DOM manipulation & Fetch API responses
│   ├── Middleware/                        # Custom Global Exception & Logging middleware
│   ├── Program.cs                         # Dependency Injection, EF Core, Authentication, Swagger
│   └── Pods.API.csproj
│
├── Pods.Application/                      # Business Logic, CQRS/Service Abstractions & DTOs
│   ├── Interfaces/                        # Service & Repository contracts
│   ├── Services/                          # Streak calculation, Group management, Check-in verification
│   ├── DTOs/                              # Strongly-typed Data Transfer Objects & ViewModels
│   ├── Validators/                        # FluentValidation request validation rules
│   └── Pods.Application.csproj
│
├── Pods.Domain/                           # Enterprise Domain Model (DDD)
│   ├── Entities/                          # AccountabilityGroup, Commitment, CheckIn, StreakRecord
│   ├── Enums/                             # CommitmentFrequency, CheckInStatus, GroupRole
│   ├── Exceptions/                        # DomainRuleViolationException
│   └── Pods.Domain.csproj
│
├── Pods.Infrastructure/                  # Data Access, Persistence & External Integrations
│   ├── Persistence/
│   │   ├── ApplicationDbContext.cs        # EF Core DbContext with Fluent API entity mapping
│   │   ├── Configurations/                # Table schemas, indexing strategies & precision constraints
│   │   ├── Migrations/                    # Code-first SQL Server database migrations
│   │   └── SqlQueries/                    # Direct SQL Server queries with Dapper, CTEs & Window Functions
│   ├── Services/
│   │   ├── AzureBlobStorageService.cs     # Azure Storage SDK for streaming proof artifacts
│   │   └── AzureOpenAiCoachingService.cs  # Azure OpenAI GPT-4o client for habit guidance & breakdown
│   └── Pods.Infrastructure.csproj
│
└── Pods.Tests/                            # Automated Testing Suite
    ├── Unit/                              # xUnit tests for streak algorithms & validation
    ├── Integration/                       # Controller tests with WebApplicationFactory
    └── Pods.Tests.csproj
```

### Key Engineering Components

| Feature Domain | .NET / C# Implementation | Details |
|---|---|---|
| **Accountability Groups** | C# Domain Entities & Aggregate Roots | Encapsulated roster limits, private invite code generation, and membership lifecycle enforcement. |
| **Commitments & Goals** | Application Services & FluentValidation | Frequency scheduling, target counts, financial stake constraints, and validation pipelines. |
| **Streak Engine** | Dedicated C# Calculation Service | High-performance streak tracking with consecutive-day detection, grace periods, and broken streak reconciliation. |
| **Data Persistence & Queries** | EF Core 8 + SQL Server + Dapper | Relational schema with foreign keys, compound indexes, and raw SQL queries utilizing CTEs and `DENSE_RANK()`. |
| **Cloud Storage** | Azure Blob Storage SDK (`Azure.Storage.Blobs`) | Secure multi-part upload and retrieval of media evidence artifacts with SAS tokens. |
| **AI / LLM Integration** | Azure OpenAI Service (`gpt-4o`) | Prompt-engineered behavioral habit analysis, risk factor detection, and milestone decomposition. |
| **Web Presentation** | ASP.NET MVC + Razor + HTML5 / CSS / JS | Full-stack Razor layouts with form validation (`asp-validation-for`), DOM manipulation, and dynamic AJAX / fetch API updates. |
| **Automated Testing** | xUnit, Moq, FluentAssertions | Unit and integration test coverage for core business workflows and streak calculations. |

### SQL Server & Raw Query Showcase

To ensure maximum performance for complex aggregations and leaderboard rankings, the application leverages raw SQL with Dapper alongside EF Core:

```sql
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
ORDER BY [Rank] ASC;
```

---

## How It Works

1. **Create or Join a Pod**: Pick an accountability track (Build & Ship, Fitness, Deep Writing, Study) and establish capacity.
2. **Commit Daily Goals**: Define quantifiable commitments, frequency, and verification methods.
3. **Submit Proof on Schedule**: Evidence is streamed to Azure Blob Storage and logged with immutable timestamps.
4. **Deterministic Streak Updates**: Verified submissions trigger the streak engine, updating leaderboards and reputation scores.

---

## Resume & Portfolio Highlights

```text
Pods – Accountability SaaS Platform | C# · .NET 8 · ASP.NET MVC · SQL Server · EF Core · Azure
• Engineered a parallel .NET 8 Clean Architecture backend incorporating ASP.NET Core Web API and ASP.NET MVC Razor views.
• Designed relational SQL Server schemas, Fluent API entity configurations, and high-performance SQL queries with window functions.
• Implemented core business logic for habit commitment lifecycles, peer review workflows, and deterministic streak calculations.
• Integrated Azure Blob Storage for evidence proof uploads and Azure OpenAI (GPT-4o) for AI-driven habit coaching.
• Authored comprehensive xUnit test suites covering domain rules, validation pipelines, and controller integration.
```

---

## Build & Test Instructions

```bash
# Navigate to the .NET solution directory
cd dotnet

# Restore NuGet dependencies
dotnet restore

# Build solution
dotnet build

# Execute automated tests
dotnet test

# Run API & MVC dashboard
dotnet run --project Pods.API
```

---

## Proven on Testnet

Not a mockup. Pods has cleared verification covering funding, roster lock, scheduled occurrences, creator review, missed-proof handling, deterministic proportional settlement, and real participant payouts. The verified core runs live on Railway today.

## License
Any content, piece of code, UI or UX design, assets, or documents can not be used, modified, reused, or redistributed by anyone, for any purpose.
