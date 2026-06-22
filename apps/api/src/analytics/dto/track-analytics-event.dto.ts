import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AnalyticsEventType } from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";

export class TrackAnalyticsEventDto {
  @ApiProperty({ enum: AnalyticsEventType })
  @IsEnum(AnalyticsEventType)
  eventType!: AnalyticsEventType;

  @ApiProperty({ description: "Client session identifier (uuid/cuid/string)" })
  @IsString()
  @MaxLength(128)
  sessionId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  orderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  searchQuery?: string;

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  tmaPlatform?: string;
}

export class TrackAnalyticsEventsBatchDto {
  @ApiProperty({ type: [TrackAnalyticsEventDto], maxItems: 50 })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => TrackAnalyticsEventDto)
  events!: TrackAnalyticsEventDto[];
}
