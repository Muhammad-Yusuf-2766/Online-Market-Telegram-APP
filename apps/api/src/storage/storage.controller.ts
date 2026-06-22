import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { PresignUploadDto } from "./dto/presign-upload.dto";
import { PresignUploadResponseDto } from "./dto/presign-upload-response.dto";
import { StorageService } from "./storage.service";

@ApiTags("storage")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard)
@Controller("admin/storage")
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post("presign")
  @ApiOperation({ summary: "Get a presigned PUT URL for uploading an object to MinIO (S3-compatible)" })
  @ApiOkResponse({ type: PresignUploadResponseDto })
  async presign(@Body() body: PresignUploadDto): Promise<PresignUploadResponseDto> {
    const prefix = body.keyPrefix ?? "products/";
    return this.storage.createPresignedPutUrl(body.contentType, prefix);
  }
}
