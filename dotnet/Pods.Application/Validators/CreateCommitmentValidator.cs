using FluentValidation;
using Pods.Application.DTOs;

namespace Pods.Application.Validators;

public class CreateCommitmentValidator : AbstractValidator<CreateCommitmentDto>
{
    public CreateCommitmentValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(150).WithMessage("Title cannot exceed 150 characters.");

        RuleFor(x => x.TargetCountPerPeriod)
            .GreaterThanOrEqualTo(1).WithMessage("Target count must be at least 1.");

        RuleFor(x => x.StakeAmount)
            .GreaterThanOrEqualTo(0).WithMessage("Stake amount cannot be negative.");

        RuleFor(x => x.StartDateUtc)
            .NotEmpty().WithMessage("Start date is required.");
    }
}
