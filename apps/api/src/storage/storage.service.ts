import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";

@Injectable()
export class StorageService {
  private client: S3Client | null = null;
  private readonly bucket: string;
  private readonly publicBase: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>("MINIO_BUCKET") ?? "parfumbox";
    const endpoint = this.config.get<string>("MINIO_ENDPOINT") ?? "http://127.0.0.1";
    const port = this.config.get<string>("MINIO_PORT") ?? "9000";
    this.publicBase = (this.config.get<string>("MINIO_PUBLIC_URL") ?? `${endpoint}:${port}`).replace(/\/$/, "");
  }

  async createPresignedPutUrl(contentType: string, keyPrefix = "uploads/"): Promise<{
    uploadUrl: string;
    key: string;
    publicUrl: string;
  }> {
    const accessKey = this.config.get<string>("MINIO_ACCESS_KEY");
    const secretKey = this.config.get<string>("MINIO_SECRET_KEY");
    if (!accessKey || !secretKey) {
      throw new ServiceUnavailableException("MinIO credentials are not configured");
    }

    const client = this.getOrCreateClient(accessKey, secretKey);
    const safePrefix = keyPrefix.replace(/^\/+/, "").replace(/[^a-zA-Z0-9/_.-]/g, "") || "uploads/";
    const ext = this.extensionFromContentType(contentType);
    const key = `${safePrefix}${randomUUID()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const expiresIn = Number(this.config.get<string>("MINIO_PRESIGN_EXPIRES_SEC") ?? 3600);
    const uploadUrl = await getSignedUrl(client, command, { expiresIn });
    const publicUrl = `${this.publicBase}/${this.bucket}/${key}`;

    return { uploadUrl, key, publicUrl };
  }

  private getOrCreateClient(accessKey: string, secretKey: string): S3Client {
    if (this.client) {
      return this.client;
    }

    const endpoint = this.config.get<string>("MINIO_ENDPOINT") ?? "http://127.0.0.1";
    const port = this.config.get<string>("MINIO_PORT") ?? "9000";
    const useSsl = this.config.get<string>("MINIO_USE_SSL") === "true";

    const url = new URL(endpoint.includes("://") ? endpoint : `http://${endpoint}`);
    if (!url.port && port) {
      url.port = port;
    }
    url.protocol = useSsl ? "https:" : "http:";

    this.client = new S3Client({
      region: "us-east-1",
      endpoint: url.origin,
      forcePathStyle: true,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });
    return this.client;
  }

  private extensionFromContentType(contentType: string): string {
    const base = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
    const map: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/gif": ".gif",
    };
    return map[base] ?? "";
  }
}
