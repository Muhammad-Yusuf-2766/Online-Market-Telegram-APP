import { Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { PresignUploadDto } from "./dto/presign-upload.dto";
import { PresignUploadResponseDto } from "./dto/presign-upload-response.dto";
import { LocalImageUpload, StorageService } from "./storage.service";

@ApiTags("storage")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard)
@Controller("admin")
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post("storage/presign")
  @ApiOperation({ summary: "Get a presigned PUT URL for uploading an object to MinIO (S3-compatible)" })
  @ApiOkResponse({ type: PresignUploadResponseDto })
  async presign(@Body() body: PresignUploadDto): Promise<PresignUploadResponseDto> {
    const prefix = body.keyPrefix ?? "products/";
    return this.storage.createPresignedPutUrl(body.contentType, prefix);
  }

  @Post("uploads/product-images")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiOperation({ summary: "Upload a product image to local backend storage" })
  @ApiOkResponse({ description: "Uploaded image URL" })
  uploadProductImage(@UploadedFile() file?: LocalImageUpload): Promise<{ url: string }> {
    return this.storage.saveLocalImage(file, "product-images");
  }

  @Post("uploads/banner-images")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiOperation({ summary: "Upload a banner image to local backend storage" })
  @ApiOkResponse({ description: "Uploaded image URL" })
  uploadBannerImage(@UploadedFile() file?: LocalImageUpload): Promise<{ url: string }> {
    return this.storage.saveLocalImage(file, "banner-images");
  }

  @Post("uploads/branding-logo")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiOperation({ summary: "Upload a market branding logo to local backend storage" })
  @ApiOkResponse({ description: "Uploaded image URL" })
  uploadBrandingLogo(@UploadedFile() file?: LocalImageUpload): Promise<{ url: string }> {
    return this.storage.saveLocalImage(file, "branding");
  }
}
