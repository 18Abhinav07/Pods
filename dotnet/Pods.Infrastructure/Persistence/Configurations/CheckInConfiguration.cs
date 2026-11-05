using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pods.Domain.Entities;

namespace Pods.Infrastructure.Persistence.Configurations;

public class CheckInConfiguration : IEntityTypeConfiguration<CheckIn>
{
    public void Configure(EntityTypeBuilder<CheckIn> builder)
    {
        builder.ToTable("CheckIns");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Notes)
            .HasMaxLength(1000);

        builder.Property(c => c.RejectionReason)
            .HasMaxLength(500);

        builder.HasMany(c => c.Proofs)
            .WithOne(p => p.CheckIn)
            .HasForeignKey(p => p.CheckInId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(c => new { c.CommitmentId, c.CheckInTimestampUtc });
        builder.HasIndex(c => new { c.UserId, c.Status });
    }
}
