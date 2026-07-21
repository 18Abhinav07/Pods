import { randomUUID } from "node:crypto";

import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import sharp from "sharp";

const maximumEvidenceBytes = 8 * 1024 * 1024;

export async function sanitizeEvidenceImage(source: Buffer) {
  if (source.byteLength === 0 || source.byteLength > maximumEvidenceBytes) {
    throw new Error("Choose an image smaller than 8 MB");
  }
  try {
    const bytes = await sharp(source, { failOn: "warning" })
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({ quality: 84 })
      .toBuffer();
    return { bytes, contentType: "image/webp" as const, extension: "webp" as const };
  } catch {
    throw new Error("Choose a valid JPG, PNG, HEIC, AVIF, or WebP image");
  }
}

type StorageConfiguration = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

function readStorageConfiguration(
  environment: NodeJS.ProcessEnv = process.env
): StorageConfiguration {
  const endpoint = environment.PODS_S3_ENDPOINT;
  const region = environment.PODS_S3_REGION ?? "us-east-1";
  const bucket = environment.PODS_S3_BUCKET;
  const accessKeyId = environment.PODS_S3_ACCESS_KEY_ID;
  const secretAccessKey = environment.PODS_S3_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("Private evidence storage is not configured");
  }
  return { endpoint, region, bucket, accessKeyId, secretAccessKey };
}

function bucketIsMissing(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { name?: unknown; $metadata?: { httpStatusCode?: unknown } };
  return (
    candidate.name === "NotFound" ||
    candidate.name === "NoSuchBucket" ||
    candidate.$metadata?.httpStatusCode === 404
  );
}

export class PrivateEvidenceStorage {
  readonly #client: S3Client;
  readonly #bucket: string;
  #bucketReady: Promise<void> | null = null;

  constructor(configuration = readStorageConfiguration()) {
    this.#bucket = configuration.bucket;
    this.#client = new S3Client({
      endpoint: configuration.endpoint,
      region: configuration.region,
      forcePathStyle: true,
      credentials: {
        accessKeyId: configuration.accessKeyId,
        secretAccessKey: configuration.secretAccessKey
      }
    });
  }

  async #ensureBucket() {
    this.#bucketReady ??= (async () => {
      try {
        await this.#client.send(new HeadBucketCommand({ Bucket: this.#bucket }));
      } catch (error) {
        if (!bucketIsMissing(error)) throw error;
        await this.#client.send(new CreateBucketCommand({ Bucket: this.#bucket }));
      }
    })();
    return this.#bucketReady;
  }

  async storeImage(input: {
    podId: string;
    membershipId: string;
    occurrenceId: string;
    source: Buffer;
  }) {
    const sanitized = await sanitizeEvidenceImage(input.source);
    await this.#ensureBucket();
    const objectKey = [
      "pods",
      input.podId,
      "members",
      input.membershipId,
      "occurrences",
      input.occurrenceId,
      `${randomUUID()}.${sanitized.extension}`
    ].join("/");
    await this.#client.send(
      new PutObjectCommand({
        Bucket: this.#bucket,
        Key: objectKey,
        Body: sanitized.bytes,
        ContentType: sanitized.contentType,
        CacheControl: "private, no-store"
      })
    );
    return {
      objectKey,
      contentType: sanitized.contentType,
      byteSize: sanitized.bytes.byteLength
    };
  }

  async readImage(objectKey: string) {
    await this.#ensureBucket();
    const result = await this.#client.send(
      new GetObjectCommand({ Bucket: this.#bucket, Key: objectKey })
    );
    if (!result.Body) throw new Error("Evidence image is unavailable");
    return {
      bytes: Buffer.from(await result.Body.transformToByteArray()),
      contentType: result.ContentType ?? "image/webp"
    };
  }

  async deleteImage(objectKey: string) {
    await this.#ensureBucket();
    await this.#client.send(
      new DeleteObjectCommand({ Bucket: this.#bucket, Key: objectKey })
    );
  }
}

let storage: PrivateEvidenceStorage | null = null;

export function privateEvidenceStorage() {
  storage ??= new PrivateEvidenceStorage();
  return storage;
}
