using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Pods.Application.Services;
using Pods.Domain.Entities;
using Pods.Domain.Enums;
using Pods.Infrastructure.Persistence;
using Xunit;

namespace Pods.Tests.Unit;

public class StreakCalculationServiceTests
{
    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task UpdateStreakOnCheckInAsync_WhenFirstCheckIn_SetsStreakToOne()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var service = new StreakCalculationService(context);
        var userId = Guid.NewGuid();
        var commitmentId = Guid.NewGuid();
        var checkInDate = DateTime.UtcNow;

        // Act
        var streak = await service.UpdateStreakOnCheckInAsync(userId, commitmentId, checkInDate);

        // Assert
        streak.Should().NotNull();
        streak.CurrentStreakDays.Should().Be(1);
        streak.LongestStreakDays.Should().Be(1);
        streak.TotalCompletedCheckIns.Should().Be(1);
    }

    [Fact]
    public async Task UpdateStreakOnCheckInAsync_WhenConsecutiveDays_IncrementsStreak()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var service = new StreakCalculationService(context);
        var userId = Guid.NewGuid();
        var commitmentId = Guid.NewGuid();
        var day1 = DateTime.UtcNow.AddDays(-1);
        var day2 = DateTime.UtcNow;

        // Act
        await service.UpdateStreakOnCheckInAsync(userId, commitmentId, day1);
        var streak = await service.UpdateStreakOnCheckInAsync(userId, commitmentId, day2);

        // Assert
        streak.CurrentStreakDays.Should().Be(2);
        streak.LongestStreakDays.Should().Be(2);
        streak.TotalCompletedCheckIns.Should().Be(2);
    }

    [Fact]
    public async Task UpdateStreakOnCheckInAsync_WhenDaysMissed_ResetsStreakToOne()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var service = new StreakCalculationService(context);
        var userId = Guid.NewGuid();
        var commitmentId = Guid.NewGuid();
        var day1 = DateTime.UtcNow.AddDays(-5);
        var day2 = DateTime.UtcNow;

        // Act
        await service.UpdateStreakOnCheckInAsync(userId, commitmentId, day1);
        var streak = await service.UpdateStreakOnCheckInAsync(userId, commitmentId, day2);

        // Assert
        streak.CurrentStreakDays.Should().Be(1);
        streak.LongestStreakDays.Should().Be(1);
        streak.TotalCompletedCheckIns.Should().Be(2);
    }
}
