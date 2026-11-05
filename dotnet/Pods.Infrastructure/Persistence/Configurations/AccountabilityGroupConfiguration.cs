using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pods.Domain.Entities;

namespace Pods.Infrastructure.Persistence.Configurations;

public class AccountabilityGroupConfiguration : IEntityTypeConfiguration<AccountabilityGroup>
{
    public void Configure(EntityTypeBuilder<AccountabilityGroup> builder)
    {
        builder.ToTable("AccountabilityGroups");

        builder.HasKey(g => g.Id);

        builder.Property(g => g.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(g => g.Slug)
            .IsRequired()
            .HasMaxLength(120);

        builder.HasIndex(g => g.Slug).IsUnique();

        builder.Property(g => g.Description)
            .HasMaxLength(500);

        builder.Property(g => g.Category)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(g => g.InviteCode)
            .HasMaxLength(16);

        builder.HasMany(g => g.Memberships)
            .WithOne(m => m.Group)
            .HasForeignKey(m => m.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(g => g.Commitments)
            .WithOne(c => c.Group)
            .HasForeignKey(c => c.GroupId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
