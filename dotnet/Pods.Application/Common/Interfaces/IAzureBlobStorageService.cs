namespace Pods.Application.Common.Interfaces;

public interface IAzureBlobStorageService
{
    Task<string> UploadFileAsync(Stream stream, string fileName, string contentType, string containerName, CancellationToken cancellationToken = default);
    Task<bool> DeleteFileAsync(string fileUrl, string containerName, CancellationToken cancellationToken = default);
}
