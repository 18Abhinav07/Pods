using Microsoft.EntityFrameworkCore;
using Pods.Application.Common.Interfaces;
using Pods.Domain.Entities;
using System.Reflection;

namespace Pods.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<AccountabilityGroup> AccountabilityGroups => Set<AccountabilityGroup>();
    public DbSet<GroupMembership> GroupMemberships => Set<GroupMembership>();
    public DbSet<Commitment> Commitments => Set<Commitment>();
    public DbSet<CheckIn> CheckIns => Set<CheckIn>();
    public DbSet<CheckInProof> CheckInProofs => Set<CheckInProof>();
    public DbSet<StreakRecord> StreakRecords => Set<StreakRecord>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        // Entities create their own Guid ids in the domain. Telling EF the key is never
        // store-generated makes children added through a navigation (a check-in on a
        // commitment, a membership on a group) get inserted rather than treated as updates.
        foreach (var entityType in modelBuilder.Model.GetEntityTypes()
                     .Where(t => typeof(Pods.Domain.Common.BaseEntity).IsAssignableFrom(t.ClrType)))
        {
            modelBuilder.Entity(entityType.ClrType).Property(nameof(Pods.Domain.Common.BaseEntity.Id)).ValueGeneratedNever();
        }
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<Pods.Domain.Common.BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAtUtc = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAtUtc = DateTime.UtcNow;
                    break;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
