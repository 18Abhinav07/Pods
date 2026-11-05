using FluentAssertions;
using Pods.Application.DTOs;
using Pods.Application.Validators;
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
}
