using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pods.Infrastructure.Persistence.Migrations;

public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "AuditLogs",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                EntityName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                EntityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Action = table.Column<string>(type: "nvarchar(max)", nullable: false),
                UserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                DetailsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                IpAddress = table.Column<string>(type: "nvarchar(max)", nullable: false),
                CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDeleted = table.Column<bool>(type: "bit", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AuditLogs", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "UserProfiles",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                ExternalUserId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                Username = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                DisplayName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                AvatarUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                TimeZone = table.Column<string>(type: "nvarchar(max)", nullable: false),
                ReputationScore = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false, defaultValue: 100.0m),
                CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDeleted = table.Column<bool>(type: "bit", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_UserProfiles", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "AccountabilityGroups",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                Slug = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                Category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                CreatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                MaxMembers = table.Column<int>(type: "int", nullable: false),
                IsPrivate = table.Column<bool>(type: "bit", nullable: false),
                InviteCode = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: true),
                CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDeleted = table.Column<bool>(type: "bit", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AccountabilityGroups", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "GroupMemberships",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                GroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Role = table.Column<int>(type: "int", nullable: false),
                IsActive = table.Column<bool>(type: "bit", nullable: false),
                JoinedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDeleted = table.Column<bool>(type: "bit", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_GroupMemberships", x => x.Id);
                table.ForeignKey(
                    name: "FK_GroupMemberships_AccountabilityGroups_GroupId",
                    column: x => x.GroupId,
                    principalTable: "AccountabilityGroups",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_GroupMemberships_UserProfiles_UserId",
                    column: x => x.UserId,
                    principalTable: "UserProfiles",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "Commitments",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                GroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Title = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                Frequency = table.Column<int>(type: "int", nullable: false),
                Status = table.Column<int>(type: "int", nullable: false),
                VerificationMethod = table.Column<int>(type: "int", nullable: false),
                TargetCountPerPeriod = table.Column<int>(type: "int", nullable: false),
                StartDateUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                EndDateUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                StakeAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false, defaultValue: 0m),
                CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDeleted = table.Column<bool>(type: "bit", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Commitments", x => x.Id);
                table.ForeignKey(
                    name: "FK_Commitments_AccountabilityGroups_GroupId",
                    column: x => x.GroupId,
                    principalTable: "AccountabilityGroups",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_Commitments_UserProfiles_UserId",
                    column: x => x.UserId,
                    principalTable: "UserProfiles",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "CheckIns",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CommitmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CheckInTimestampUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                Status = table.Column<int>(type: "int", nullable: false),
                VerificationMethod = table.Column<int>(type: "int", nullable: false),
                VerifiedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                VerifiedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                RejectionReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDeleted = table.Column<bool>(type: "bit", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CheckIns", x => x.Id);
                table.ForeignKey(
                    name: "FK_CheckIns_Commitments_CommitmentId",
                    column: x => x.CommitmentId,
                    principalTable: "Commitments",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_CheckIns_UserProfiles_UserId",
                    column: x => x.UserId,
                    principalTable: "UserProfiles",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.NoAction);
            });

        migrationBuilder.CreateTable(
            name: "CheckInProofs",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CheckInId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                FileUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                FileType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDeleted = table.Column<bool>(type: "bit", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CheckInProofs", x => x.Id);
                table.ForeignKey(
                    name: "FK_CheckInProofs_CheckIns_CheckInId",
                    column: x => x.CheckInId,
                    principalTable: "CheckIns",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "StreakRecords",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CommitmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CurrentStreakDays = table.Column<int>(type: "int", nullable: false),
                LongestStreakDays = table.Column<int>(type: "int", nullable: false),
                LastCheckInDateUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                TotalCompletedCheckIns = table.Column<int>(type: "int", nullable: false),
                CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDeleted = table.Column<bool>(type: "bit", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_StreakRecords", x => x.Id);
                table.ForeignKey(
                    name: "FK_StreakRecords_Commitments_CommitmentId",
                    column: x => x.CommitmentId,
                    principalTable: "Commitments",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_StreakRecords_UserProfiles_UserId",
                    column: x => x.UserId,
                    principalTable: "UserProfiles",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.NoAction);
            });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "CheckInProofs");
        migrationBuilder.DropTable(name: "CheckIns");
        migrationBuilder.DropTable(name: "StreakRecords");
        migrationBuilder.DropTable(name: "Commitments");
        migrationBuilder.DropTable(name: "GroupMemberships");
        migrationBuilder.DropTable(name: "AccountabilityGroups");
        migrationBuilder.DropTable(name: "UserProfiles");
        migrationBuilder.DropTable(name: "AuditLogs");
    }
}
