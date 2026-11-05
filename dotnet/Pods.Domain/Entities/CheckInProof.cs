using Pods.Domain.Common;

namespace Pods.Domain.Entities;

public class CheckInProof : BaseEntity
{
    public Guid CheckInId { get; private set; }
    public string FileUrl { get; private set; } = string.Empty;
    public string FileType { get; private set; } = string.Empty;
    public long FileSizeBytes { get; private set; }

    public CheckIn CheckIn { get; private set; } = null!;

    protected CheckInProof() { }

    public CheckInProof(Guid checkInId, string fileUrl, string fileType, long fileSizeBytes)
    {
        CheckInId = checkInId;
        FileUrl = fileUrl;
        FileType = fileType;
        FileSizeBytes = fileSizeBytes;
    }
}
