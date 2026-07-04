import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { BadRequestException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { access, mkdir, rm, writeFile } from "node:fs/promises";
import { extname, isAbsolute, join, normalize, relative, resolve } from "node:path";
import { Logger } from "@nestjs/common";

export type LocalImageUpload = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client | null = null;
  private readonly bucket: string;
  private readonly publicBase: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>("MINIO_BUCKET") ?? "ansor-market";
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

  async saveLocalImage(
    file: LocalImageUpload | undefined,
    folder: "product-images" | "banner-images" | "branding",
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException("Image file is required");
    }
    if (!this.isAllowedImageType(file.mimetype)) {
      throw new BadRequestException("Only JPG, PNG, WebP, and GIF images are allowed");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException("Image file must be 5 MB or smaller");
    }

    const ext = this.extensionFromContentType(file.mimetype) || this.safeExtension(file.originalname);
    const filename = `${randomUUID()}${ext}`;
    const uploadDir = join(__dirname, "..", "..", "uploads", folder);
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), file.buffer);

    const publicBase = this.localPublicBase();
    return { url: `${publicBase}/uploads/${folder}/${filename}` };
  }

  async deleteUploadedFileIfExists(value: string | null | undefined): Promise<void> {
    const filePath = this.resolveUploadFilePath(value);
    if (!filePath) return;

    try {
      await access(filePath, constants.F_OK);
    } catch {
      return;
    }

    try {
      await rm(filePath, { force: true });
    } catch (error) {
      this.logger.warn(
        `Failed to delete local upload ${filePath}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  resolveUploadFilePath(value: string | null | undefined): string | null {
    const raw = value?.trim();
    if (!raw) return null;

    const relativeUploadPath = this.relativeUploadPath(raw);
    if (!relativeUploadPath) return null;

    const uploadsRoot = this.uploadsRoot();
    const target = resolve(uploadsRoot, relativeUploadPath);
    const rel = relative(uploadsRoot, target);
    if (!rel || rel.startsWith("..") || isAbsolute(rel)) {
      return null;
    }
    return target;
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

  private isAllowedImageType(contentType: string): boolean {
    const base = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
    return ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(base);
  }

  private safeExtension(filename: string): string {
    const ext = extname(filename).toLowerCase();
    return [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ? ext : ".jpg";
  }

  private localPublicBase(): string {
    const configured =
      this.config.get<string>("API_PUBLIC_URL") ??
      this.config.get<string>("PUBLIC_API_URL");
    return configured?.trim().replace(/\/$/, "") ?? "";
  }

  private uploadsRoot(): string {
    return resolve(__dirname, "..", "..", "uploads");
  }

  private relativeUploadPath(value: string): string | null {
    const urlPath = this.localUploadPathFromUrl(value);
    const rawPath = urlPath ?? value;
    const normalizedInput = rawPath.replace(/\\/g, "/").replace(/^\/+/, "");
    if (!normalizedInput.startsWith("uploads/")) return null;

    let decoded: string;
    try {
      decoded = decodeURIComponent(normalizedInput);
    } catch {
      return null;
    }
    const withoutRoot = decoded.slice("uploads/".length);
    if (!withoutRoot || withoutRoot.includes("\0")) return null;

    const normalized = normalize(withoutRoot);
    if (normalized.startsWith("..") || isAbsolute(normalized)) {
      return null;
    }
    return normalized;
  }

  private localUploadPathFromUrl(value: string): string | null {
    if (!/^https?:\/\//i.test(value)) return null;

    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return null;
    }
    if (!url.pathname.startsWith("/uploads/")) return null;
    if (!this.isKnownLocalUploadOrigin(url)) return null;
    return url.pathname;
  }

  private isKnownLocalUploadOrigin(url: URL): boolean {
    const configuredOrigins = [
      this.config.get<string>("API_PUBLIC_URL"),
      this.config.get<string>("PUBLIC_API_URL"),
    ]
      .map((raw) => {
        try {
          return raw ? new URL(raw).origin : null;
        } catch {
          return null;
        }
      })
      .filter((origin): origin is string => Boolean(origin));

    if (configuredOrigins.includes(url.origin)) return true;
    return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname);
  }
}
