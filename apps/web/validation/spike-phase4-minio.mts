import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";

const bucket = `pods-phase4-spike-${Date.now()}`;
const key = "member/occurrence/evidence.txt";
const expected = "private evidence round trip";
const client = new S3Client({
  endpoint: "http://127.0.0.1:59000",
  forcePathStyle: true,
  region: "us-east-1",
  credentials: {
    accessKeyId: "pods-local",
    secretAccessKey: "pods-local-password"
  }
});

await client.send(new CreateBucketCommand({ Bucket: bucket }));
await client.send(new PutObjectCommand({
  Bucket: bucket,
  Key: key,
  Body: expected,
  ContentType: "text/plain"
}));
const stored = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
const actual = await stored.Body?.transformToString();
if (actual !== expected) throw new Error(`Evidence mismatch: ${actual ?? "missing"}`);
await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
await client.send(new DeleteBucketCommand({ Bucket: bucket }));

console.log(JSON.stringify({ status: "PASS", bucketPrivateByDefault: true, roundTrip: actual }));
