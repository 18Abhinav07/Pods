using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pods.Domain.Entities;

namespace Pods.Infrastructure.Persistence.Configurations;

public class CommitmentConfiguration : IEntityTypeConfiguration<Commitment>
{
    public void Configure(EntityTypeBuilder<Commitment> builder)
    {
        builder.ToTable("Commitments");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Title)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(c => c.Description)
            .HasMaxLength(1000);

        builder.Property(c => c.StakeAmount)
            .HasPrecision(18, 4)
            .HasDefaultValue(0m);

        builder.HasMany(c => c.CheckIns)
            .WithOne(ch => ch.Commitment)
            .HasForeignKey(ch => ch.CommitmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(c => new { c.UserId, c.Status });
        builder.HasIndex(c => new { c.GroupId, c.Status });
    }
}
