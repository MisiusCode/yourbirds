import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: process.env.AWS_REGION || 'eu-north-1' });
const BUCKET = process.env.S3_BUCKET;

/**
 * Upload a buffer to S3.
 * @param {string} key   - S3 object key, e.g. "uploads/photo.jpg"
 * @param {Buffer} body  - file contents
 * @param {string} contentType - MIME type, e.g. "image/jpeg"
 * @returns {string} Public URL of the uploaded object
 */
export async function uploadToS3(key, body, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
  return `https://${BUCKET}.s3.amazonaws.com/${key}`;
}

/**
 * Download an S3 object as a Buffer.
 * @param {string} key - S3 object key
 * @returns {Buffer}
 */
export async function downloadFromS3(key) {
  const { Body } = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const chunks = [];
  for await (const chunk of Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

/**
 * Delete an S3 object.
 * @param {string} key - S3 object key
 */
export async function deleteFromS3(key) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
