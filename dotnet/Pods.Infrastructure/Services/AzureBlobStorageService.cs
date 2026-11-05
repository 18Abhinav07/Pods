using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Configuration;
using Pods.Application.Common.Interfaces;

namespace Pods.Infrastructure.Services;

public class AzureBlobStorageService : IAzureBlobStorageService
{
    private readonly BlobServiceClient? _blobServiceClient;
    private readonly bool _useLocalStorageFallback;

    public AzureBlobStorageService(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("AzureBlobStorage");
        if (!string.IsNullOrEmpty(connectionString))
        {
            _blobServiceClient = new BlobServiceClient(connectionString);
            _useLocalStorageFallback = false;
        }
        else
        {
            _useLocalStorageFallback = true;
        }
    }

    public async Task<string> UploadFileAsync(Stream stream, string fileName, string contentType, string containerName, CancellationToken cancellationToken = default)
    {
        if (_useLocalStorageFallback || _blobServiceClient == null)
        {
            return $"/uploads/{containerName}/{fileName}";
        }

        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
        await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob, cancellationToken: cancellationToken);

        var blobClient = containerClient.GetBlobClient(fileName);
        var headers = new BlobHttpHeaders { ContentType = contentType };
        await blobClient.UploadAsync(stream, new BlobUploadOptions { HttpHeaders = headers }, cancellationToken);

        return blobClient.Uri.ToString();
    }

    public async Task<bool> DeleteFileAsync(string fileUrl, string containerName, CancellationToken cancellationToken = default)
    {
        if (_useLocalStorageFallback || _blobServiceClient == null)
        {
            return true;
        }

        var uri = new Uri(fileUrl);
        var blobName = Path.GetFileName(uri.LocalPath);
        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
        var blobClient = containerClient.GetBlobClient(blobName);

        var response = await blobClient.DeleteIfExistsAsync(cancellationToken: cancellationToken);
        return response.Value;
    }
}
