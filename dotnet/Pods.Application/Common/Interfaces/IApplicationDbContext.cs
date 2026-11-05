using Microsoft.EntityFrameworkCore;
using Pods.Domain.Entities;

namespace Pods.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<UserProfile> UserProfiles { get; }
    DbSet<AccountabilityGroup> AccountabilityGroups { get; }
    DbSet<GroupMembership> GroupMemberships { get; }
    DbSet<Commitment> Commitments { get; }
    DbSet<CheckIn> CheckIns { get; }
    DbSet<CheckInProof> CheckInProofs { get; }
    DbSet<StreakRecord> StreakRecords { get; }
    DbSet<AuditLog> AuditLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
