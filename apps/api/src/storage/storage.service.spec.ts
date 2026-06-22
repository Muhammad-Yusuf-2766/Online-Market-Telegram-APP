import { ServiceUnavailableException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageService } from "./storage.service";

jest.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: jest.fn().mockImplementation(function MockS3Client() {
      return {};
    }),
    PutObjectCommand: jest.fn().mockImplementation((input: Record<string, unknown>) => input),
  };
});

jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn().mockResolvedValue("https://minio.test/presigned-url"),
}));

describe("StorageService", () => {
  let service: StorageService;

  const mockGet = jest.fn();

  beforeEach(async () => {
    jest.mocked(getSignedUrl).mockResolvedValue("https://minio.test/presigned-url");
    mockGet.mockImplementation((key: string) => {
      const map: Record<string, string> = {
        MINIO_BUCKET: "mybucket",
        MINIO_ENDPOINT: "http://127.0.0.1",
        MINIO_PORT: "9000",
        MINIO_PUBLIC_URL: "http://127.0.0.1:9000",
        MINIO_ACCESS_KEY: "access",
        MINIO_SECRET_KEY: "secret",
        MINIO_PRESIGN_EXPIRES_SEC: "1800",
        MINIO_USE_SSL: "false",
      };
      return map[key];
    });

    const moduleRef = await Test.createTestingModule({
      providers: [StorageService, { provide: ConfigService, useValue: { get: mockGet } }],
    }).compile();
    service = moduleRef.get(StorageService);
  });

  it("throws ServiceUnavailableException when credentials are missing", async () => {
    mockGet.mockImplementation((key: string) => {
      if (key === "MINIO_ACCESS_KEY" || key === "MINIO_SECRET_KEY") return undefined;
      if (key === "MINIO_PUBLIC_URL") return "http://127.0.0.1:9000";
      if (key === "MINIO_BUCKET") return "b";
      return undefined;
    });
    const fresh = await Test.createTestingModule({
      providers: [StorageService, { provide: ConfigService, useValue: { get: mockGet } }],
    }).compile();
    const svc = fresh.get(StorageService);
    await expect(svc.createPresignedPutUrl("image/jpeg")).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("returns presigned upload URL, key, and public URL", async () => {
    const result = await service.createPresignedPutUrl("image/png", "avatars/");
    expect(result.uploadUrl).toBe("https://minio.test/presigned-url");
    expect(result.key).toMatch(/^avatars\/[0-9a-f-]+\.png$/i);
    expect(result.publicUrl).toContain("http://127.0.0.1:9000/mybucket/");
    expect(result.publicUrl).toContain(result.key);
    expect(getSignedUrl).toHaveBeenCalled();
  });

  it("uses configured presign expiry", async () => {
    await service.createPresignedPutUrl("image/jpeg");
    expect(getSignedUrl).toHaveBeenCalledWith(expect.anything(), expect.anything(), { expiresIn: 1800 });
  });
});
