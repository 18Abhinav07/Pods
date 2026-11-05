using FluentAssertions;
using Pods.Domain.Entities;
using Pods.Domain.Enums;
using Pods.Domain.Exceptions;
using Xunit;

namespace Pods.Tests.Unit;

public class AccountabilityGroupTests
{
    [Fact]
    public void Constructor_AddsCreatorAsActiveCreatorMember()
    {
        var creator = Guid.NewGuid();
        var group = new AccountabilityGroup("Morning Runners", "morning-runners", "", "Fitness", creator);

        group.Memberships.Should().ContainSingle(m => m.UserId == creator && m.Role == GroupRole.Creator && m.IsActive);
    }

    [Fact]
    public void Constructor_PrivateGroupGetsInviteCode_PublicDoesNot()
    {
        new AccountabilityGroup("Private Pod", "private-pod", "", "Study", Guid.NewGuid(), isPrivate: true)
            .InviteCode.Should().HaveLength(8);
        new AccountabilityGroup("Public Pod", "public-pod", "", "Study", Guid.NewGuid())
            .InviteCode.Should().BeNull();
    }

    [Fact]
    public void AddMember_WhenAtCapacity_Throws()
    {
        var group = new AccountabilityGroup("Pair", "pair", "", "Study", Guid.NewGuid(), maxMembers: 2);
        group.AddMember(Guid.NewGuid());

        var act = () => group.AddMember(Guid.NewGuid());

        act.Should().Throw<DomainRuleViolationException>().WithMessage("*maximum capacity of 2*");
    }

    [Fact]
    public void AddMember_WhenAlreadyActive_Throws()
    {
        var group = new AccountabilityGroup("Pod", "pod", "", "Study", Guid.NewGuid());
        var user = Guid.NewGuid();
        group.AddMember(user);

        var act = () => group.AddMember(user);

        act.Should().Throw<DomainRuleViolationException>().WithMessage("*already an active member*");
    }

    [Fact]
    public void AddMember_AfterLeaving_ReactivatesTheSameMembership()
    {
        var group = new AccountabilityGroup("Pod", "pod", "", "Study", Guid.NewGuid());
        var user = Guid.NewGuid();
        group.AddMember(user);
        group.RemoveMember(user);

        group.AddMember(user, GroupRole.Moderator);

        group.Memberships.Where(m => m.UserId == user).Should().ContainSingle()
            .Which.Should().Match<GroupMembership>(m => m.IsActive && m.Role == GroupRole.Moderator);
    }

    [Fact]
    public void RemoveMember_WhenSoleCreator_Throws()
    {
        var creator = Guid.NewGuid();
        var group = new AccountabilityGroup("Pod", "pod", "", "Study", creator);

        var act = () => group.RemoveMember(creator);

        act.Should().Throw<DomainRuleViolationException>().WithMessage("*sole creator*");
    }

    [Fact]
    public void Constructor_WhenNameBlank_Throws()
    {
        var act = () => new AccountabilityGroup(" ", "x", "", "Study", Guid.NewGuid());
        act.Should().Throw<DomainRuleViolationException>();
    }
}

public class CommitmentTests
{
    private static Commitment Make(VerificationMethod method = VerificationMethod.SelfReported) =>
        new(Guid.NewGuid(), Guid.NewGuid(), "Read 20 pages", "", CommitmentFrequency.Daily, method, 1, DateTime.UtcNow.Date);

    [Fact]
    public void Constructor_WhenEndBeforeStart_Throws()
    {
        var start = DateTime.UtcNow.Date;
        var act = () => new Commitment(Guid.NewGuid(), Guid.NewGuid(), "Run", "", CommitmentFrequency.Daily,
            VerificationMethod.SelfReported, 1, start, start.AddDays(-1));

        act.Should().Throw<DomainRuleViolationException>().WithMessage("*End date*");
    }

    [Fact]
    public void Constructor_WhenTargetBelowOne_Throws()
    {
        var act = () => new Commitment(Guid.NewGuid(), Guid.NewGuid(), "Run", "", CommitmentFrequency.Daily,
            VerificationMethod.SelfReported, 0, DateTime.UtcNow);

        act.Should().Throw<DomainRuleViolationException>();
    }

    [Fact]
    public void RecordCheckIn_SelfReported_IsVerifiedImmediately()
    {
        Make(VerificationMethod.SelfReported).RecordCheckIn("done").Status.Should().Be(CheckInStatus.Verified);
    }

    [Theory]
    [InlineData(VerificationMethod.PeerReview)]
    [InlineData(VerificationMethod.EvidenceUpload)]
    public void RecordCheckIn_ReviewedMethods_StartPending(VerificationMethod method)
    {
        Make(method).RecordCheckIn("done").Status.Should().Be(CheckInStatus.PendingReview);
    }

    [Fact]
    public void RecordCheckIn_WhenPaused_Throws()
    {
        var commitment = Make();
        commitment.Pause();

        var act = () => commitment.RecordCheckIn("done");

        act.Should().Throw<DomainRuleViolationException>().WithMessage("*inactive commitment*");
    }

    [Fact]
    public void PauseAndResume_EnforceValidTransitions()
    {
        var commitment = Make();

        commitment.Invoking(c => c.Resume()).Should().Throw<DomainRuleViolationException>();
        commitment.Pause();
        commitment.Invoking(c => c.Pause()).Should().Throw<DomainRuleViolationException>();
        commitment.Resume();

        commitment.Status.Should().Be(CommitmentStatus.Active);
    }

    [Fact]
    public void Reject_RecordsReviewerAndReason()
    {
        var checkIn = Make(VerificationMethod.PeerReview).RecordCheckIn("done");
        var reviewer = Guid.NewGuid();

        checkIn.Reject(reviewer, "Photo is from last week");

        checkIn.Status.Should().Be(CheckInStatus.Rejected);
        checkIn.VerifiedByUserId.Should().Be(reviewer);
        checkIn.RejectionReason.Should().Be("Photo is from last week");
    }
}

public class StreakRecordTests
{
    [Fact]
    public void RecordSuccessfulCheckIn_SameDayTwice_CountsCheckInButNotStreak()
    {
        var streak = new StreakRecord(Guid.NewGuid(), Guid.NewGuid());
        var day = new DateTime(2026, 3, 2, 8, 0, 0, DateTimeKind.Utc);

        streak.RecordSuccessfulCheckIn(day);
        streak.RecordSuccessfulCheckIn(day.AddHours(10));

        streak.CurrentStreakDays.Should().Be(1);
        streak.TotalCompletedCheckIns.Should().Be(2);
    }

    [Fact]
    public void RecordSuccessfulCheckIn_AfterGap_KeepsLongestStreak()
    {
        var streak = new StreakRecord(Guid.NewGuid(), Guid.NewGuid());
        var start = new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc);
        for (var i = 0; i < 4; i++) streak.RecordSuccessfulCheckIn(start.AddDays(i));

        streak.RecordSuccessfulCheckIn(start.AddDays(10));

        streak.CurrentStreakDays.Should().Be(1);
        streak.LongestStreakDays.Should().Be(4);
    }

    [Theory]
    [InlineData(1, 3)]
    [InlineData(2, 0)]
    public void ResetStreakIfBroken_OnlyResetsAfterAMissedDay(int daysLater, int expectedStreak)
    {
        var streak = new StreakRecord(Guid.NewGuid(), Guid.NewGuid());
        var start = new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc);
        for (var i = 0; i < 3; i++) streak.RecordSuccessfulCheckIn(start.AddDays(i));

        streak.ResetStreakIfBroken(start.AddDays(2 + daysLater));

        streak.CurrentStreakDays.Should().Be(expectedStreak);
        streak.LongestStreakDays.Should().Be(3);
    }
}
