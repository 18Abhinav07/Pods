using FluentValidation;
using Pods.Application.DTOs;

namespace Pods.Application.Validators;

public class CreateGroupValidator : AbstractValidator<CreateGroupDto>
{
    public CreateGroupValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Group name is required.")
            .MinimumLength(3).WithMessage("Group name must be at least 3 characters.")
            .MaximumLength(100).WithMessage("Group name cannot exceed 100 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters.");

        RuleFor(x => x.Category)
            .NotEmpty().WithMessage("Category is required.");

        RuleFor(x => x.MaxMembers)
            .InclusiveBetween(2, 100).WithMessage("Max members must be between 2 and 100.");
    }
}
