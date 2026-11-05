using FluentValidation;
using Pods.Application.DTOs;

namespace Pods.Application.Validators;

public class SubmitCheckInValidator : AbstractValidator<SubmitCheckInDto>
{
    public SubmitCheckInValidator()
    {
        RuleFor(x => x.CommitmentId)
            .NotEmpty().WithMessage("Commitment ID is required.");

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Notes cannot exceed 1000 characters.");
    }
}
