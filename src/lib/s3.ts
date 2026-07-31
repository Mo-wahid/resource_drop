import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const internalEndpoint = process.env.MINIO_INTERNAL_ENDPOINT || "localhost";
const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT || "localhost";
const port = process.env.MINIO_PORT || "9000";
const useSSL = process.env.MINIO_USE_SSL === "true";
const bucket = process.env.MINIO_BUCKET || "resourcedrop-bucket";
const accessKey = process.env.MINIO_ACCESS_KEY || "minioadmin";
const secretKey = process.env.MINIO_SECRET_KEY || "minioadmin";

const protocol = useSSL ? "https" : "http";

export const s3Client = new S3Client({
  endpoint: `${protocol}://${internalEndpoint}:${port}`,
  region: "us-east-1", // MinIO doesn't strictly need this, but AWS SDK requires it
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
  forcePathStyle: true, // Crucial for MinIO/S3 compatible storage
});

/**
 * Generates a presigned URL for uploading a file to MinIO.
 * Replaces the internal hostname with the public hostname so the browser can reach it.
 */
export async function generatePresignedUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const urlString = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour expiration
  const url = new URL(urlString);

  // Swap out the internal hostname for the public one
  if (internalEndpoint !== publicEndpoint) {
    url.hostname = publicEndpoint;
  }

  return url.toString();
}

/**
 * Generates a presigned URL for downloading a file from MinIO.
 */
export async function generatePresignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const urlString = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  const url = new URL(urlString);

  if (internalEndpoint !== publicEndpoint) {
    url.hostname = publicEndpoint;
  }

  return url.toString();
}
