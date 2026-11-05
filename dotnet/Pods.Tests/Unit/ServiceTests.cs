using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using Pods.Application.Common.Interfaces;
using Pods.Application.DTOs;
using Pods.Application.Services;
using Pods.Domain.Entities;
using Pods.Domain.Enums;
using Pods.Infrastructure.Persistence;
using Xunit;

namespace Pods.Tests.Unit;

public class ServiceTests
{
    private readonly ApplicationDbContext _db = new(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
    private readonly Mock<IAzureBlobStorageService> _blob = new();

    private (UserProfile creator, UserProfile member, AccountabilityGroup group) Seed()
    {
        var creator = new UserProfile("ext-1", "ana", "ana@example.com", "Ana");
        var member = new UserProfile("ext-2", "ben", "ben@example.com", "Ben");
        var group = new AccountabilityGroup("Builders", "builders", "", "Engineering", creator.Id);
        group.AddMember(member.Id);
        _db.UserProfiles.AddRange(creator, member);
        _db.AccountabilityGroups.Add(group);
        _db.SaveChanges();
        return (creator, member, group);
    }

    private CheckInService CheckIns() => new(_db, new StreakCalculationService(_db), _blob.Object);

    [Fact]
    public async Task CreateCommitment_WhenNotAMember_Fails()
    {
        var (_, _, group) = Seed();
        var service = new CommitmentService(_db);
        var dto = new CreateCommitmentDto(group.Id, "Run", "", CommitmentFrequency.Daily, VerificationMethod.SelfReported, 1, DateTime.UtcNow, null, 0);

        var result = await service.CreateCommitmentAsync(dto, Guid.NewGuid());

        result.Succeeded.Should().BeFalse();
        (await _db.Commitments.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task CreateCommitment_ForMember_CreatesCommitmentAndEmptyStreak()
    {
        var (_, member, group) = Seed();
        var service = new CommitmentService(_db);
        var dto = new CreateCommitmentDto(group.Id, "Run", "", CommitmentFrequency.Daily, VerificationMethod.SelfReported, 1, DateTime.UtcNow, null, 0);

        var result = await service.CreateCommitmentAsync(dto, member.Id);

        result.Succeeded.Should().BeTrue();
        result.Data!.GroupName.Should().Be("Builders");
        (await _db.StreakRecords.SingleAsync()).CurrentStreakDays.Should().Be(0);
    }

    [Fact]
    public async Task SubmitCheckIn_SelfReported_UpdatesStreakImmediately()
    {
        var (_, member, group) = Seed();
        var commitment = new Commitment(group.Id, member.Id, "Run", "", CommitmentFrequency.Daily, VerificationMethod.SelfReported, 1, DateTime.UtcNow.AddDays(-1));
        _db.Commitments.Add(commitment);
        await _db.SaveChangesAsync();

        var result = await CheckIns().SubmitCheckInAsync(new SubmitCheckInDto(commitment.Id, "5k", null, null, null), member.Id);

        result.Succeeded.Should().BeTrue();
        result.Data!.Status.Should().Be(CheckInStatus.Verified);
        (await _db.StreakRecords.SingleAsync(s => s.CommitmentId == commitment.Id)).CurrentStreakDays.Should().Be(1);
        _blob.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SubmitCheckIn_WithEvidence_UploadsProofToBlobStorage()
    {
        var (_, member, group) = Seed();
        var commitment = new Commitment(group.Id, member.Id, "Run", "", CommitmentFrequency.Daily, VerificationMethod.EvidenceUpload, 1, DateTime.UtcNow.AddDays(-1));
        _db.Commitments.Add(commitment);
        await _db.SaveChangesAsync();
        _blob.Setup(b => b.UploadFileAsync(It.IsAny<Stream>(), It.IsAny<string>(), "image/png", "proofs", It.IsAny<CancellationToken>()))
            .ReturnsAsync("https://blob/proofs/run.png");

        var dto = new SubmitCheckInDto(commitment.Id, "5k", Convert.ToBase64String(new byte[] { 1, 2, 3 }), "run.png", "image/png");
        var result = await CheckIns().SubmitCheckInAsync(dto, member.Id);

        result.Data!.Status.Should().Be(CheckInStatus.PendingReview);
        result.Data.ProofUrls.Should().Equal("https://blob/proofs/run.png");
        (await _db.StreakRecords.AnyAsync()).Should().BeFalse("pending check-ins do not count until reviewed");
    }

    [Fact]
    public async Task SubmitCheckIn_ForSomeoneElsesCommitment_Fails()
    {
        var (creator, member, group) = Seed();
        var commitment = new Commitment(group.Id, member.Id, "Run", "", CommitmentFrequency.Daily, VerificationMethod.SelfReported, 1, DateTime.UtcNow);
        _db.Commitments.Add(commitment);
        await _db.SaveChangesAsync();

        var result = await CheckIns().SubmitCheckInAsync(new SubmitCheckInDto(commitment.Id, "", null, null, null), creator.Id);

        result.Succeeded.Should().BeFalse();
    }

    [Fact]
    public async Task ReviewCheckIn_ByPlainMember_IsDenied()
    {
        var (_, member, group) = Seed();
        var commitment = new Commitment(group.Id, member.Id, "Run", "", CommitmentFrequency.Daily, VerificationMethod.PeerReview, 1, DateTime.UtcNow.AddDays(-1));
        var checkIn = commitment.RecordCheckIn("5k");
        _db.Commitments.Add(commitment);
        await _db.SaveChangesAsync();

        var result = await CheckIns().ReviewCheckInAsync(checkIn.Id, member.Id, new ReviewCheckInDto(true, null));

        result.Succeeded.Should().BeFalse();
        (await _db.CheckIns.SingleAsync()).Status.Should().Be(CheckInStatus.PendingReview);
    }

    [Fact]
    public async Task ReviewCheckIn_ApprovedByCreator_VerifiesAndStartsStreak()
    {
        var (creator, member, group) = Seed();
        var commitment = new Commitment(group.Id, member.Id, "Run", "", CommitmentFrequency.Daily, VerificationMethod.PeerReview, 1, DateTime.UtcNow.AddDays(-1));
        var checkIn = commitment.RecordCheckIn("5k");
        _db.Commitments.Add(commitment);
        await _db.SaveChangesAsync();

        var result = await CheckIns().ReviewCheckInAsync(checkIn.Id, creator.Id, new ReviewCheckInDto(true, null));

        result.Succeeded.Should().BeTrue();
        (await _db.CheckIns.SingleAsync()).VerifiedByUserId.Should().Be(creator.Id);
        (await _db.StreakRecords.SingleAsync()).CurrentStreakDays.Should().Be(1);
    }

    [Fact]
    public async Task JoinPrivateGroup_WithWrongInviteCode_Fails()
    {
        var group = new AccountabilityGroup("Secret", "secret", "", "Study", Guid.NewGuid(), isPrivate: true);
        _db.AccountabilityGroups.Add(group);
        await _db.SaveChangesAsync();
        var service = new AccountabilityGroupService(_db);

        (await service.JoinGroupAsync(group.Id, Guid.NewGuid(), "WRONG")).Succeeded.Should().BeFalse();
        (await service.JoinGroupAsync(group.Id, Guid.NewGuid(), group.InviteCode)).Succeeded.Should().BeTrue();
    }
}
