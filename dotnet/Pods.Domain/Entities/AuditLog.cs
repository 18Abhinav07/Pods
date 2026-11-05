using Pods.Domain.Common;

namespace Pods.Domain.Entities;

public class AuditLog : BaseEntity
{
    public string EntityName { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string DetailsJson { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
}
