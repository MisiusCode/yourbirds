import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.AWS_ENDPOINT_URL && { endpoint: process.env.AWS_ENDPOINT_URL }),
});
const BUCKET = process.env.S3_BUCKET;

export async function uploadFileToS3(localPath, s3Key, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
    Body: fs.readFileSync(localPath),
    ContentType: contentType,
  }));
}

export async function downloadFromS3(s3Key) {
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: s3Key }));
  const chunks = [];
  for await (const chunk of res.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export async function deleteFromS3(...s3Keys) {
  await Promise.all(
    s3Keys.map(key => s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key })).catch(() => {}))
  );
}
