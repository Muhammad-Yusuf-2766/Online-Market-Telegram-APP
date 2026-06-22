import { ApiProperty } from "@nestjs/swagger";

export class PresignUploadResponseDto {
  @ApiProperty({ description: "HTTP PUT URL for direct upload to MinIO/S3" })
  uploadUrl!: string;

  @ApiProperty({ description: "Object key inside the bucket" })
  key!: string;

  @ApiProperty({ description: "Public URL to reference after upload (if configured)" })
  publicUrl!: string;
}
