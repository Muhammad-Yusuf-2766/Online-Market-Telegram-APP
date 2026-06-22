import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsOptional } from "class-validator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { ProductFeedbackStatus } from "@prisma/client";

export class AdminProductFeedbackQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ProductFeedbackStatus, default: ProductFeedbackStatus.PENDING })
  @IsOptional()
  @IsEnum(ProductFeedbackStatus)
  status?: ProductFeedbackStatus;
}
