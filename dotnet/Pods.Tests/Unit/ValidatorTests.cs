using FluentAssertions;
using Pods.Application.DTOs;
using Pods.Application.Validators;
using Pods.Domain.Enums;
using Xunit;

namespace Pods.Tests.Unit;

public class ValidatorTests
{
    private readonly CreateGroupValidator _groupValidator = new();

    [Fact]
    public void CreateGroupValidator_WhenNameTooShort_FailsValidation()
    {
        var dto = new CreateGroupDto("AB", "Valid description", "Engineering", 10, false);
        var result = _groupValidator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Name");
    }

    [Fact]
    public void CreateGroupValidator_WhenValid_PassesValidation()
    {
        var dto = new CreateGroupDto("Cloud Engineers Pod", "Daily C# and Azure architecture practice.", "Engineering", 10, false);
        var result = _groupValidator.Validate(dto);

        result.IsValid.Should().BeTrue();
    }
    [Fact]
    public void CreateCommitmentValidator_WhenStakeNegativeAndTitleMissing_ReportsBoth()
    {
        var dto = new CreateCommitmentDto(Guid.NewGuid(), "", "", CommitmentFrequency.Daily, VerificationMethod.SelfReported, 1, DateTime.UtcNow, null, -5m);
        var result = new CreateCommitmentValidator().Validate(dto);

        result.Errors.Select(e => e.PropertyName).Should().BeEquivalentTo(new[] { "Title", "StakeAmount" });
    }

    [Theory]
    [InlineData(1, false)]
    [InlineData(2, true)]
    [InlineData(100, true)]
    [InlineData(101, false)]
    public void CreateGroupValidator_EnforcesMemberBounds(int maxMembers, bool valid)
    {
        var dto = new CreateGroupDto("Valid Pod", "", "Study", maxMembers, false);
        _groupValidator.Validate(dto).IsValid.Should().Be(valid);
    }

    [Fact]
    public void SubmitCheckInValidator_WhenNotesTooLongOrCommitmentEmpty_Fails()
    {
        var dto = new SubmitCheckInDto(Guid.Empty, new string('x', 1001), null, null, null);
        var result = new SubmitCheckInValidator().Validate(dto);

        result.Errors.Select(e => e.PropertyName).Should().BeEquivalentTo(new[] { "CommitmentId", "Notes" });
    }
}
