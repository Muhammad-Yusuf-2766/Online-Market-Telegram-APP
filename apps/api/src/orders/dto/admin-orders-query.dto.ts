import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";
import { OrderStatus } from "@prisma/client";

export class AdminOrdersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  /** Inclusive start (YYYY-MM-DD, UTC start of day). */
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  /** Inclusive end (YYYY-MM-DD, UTC end of day). */
  @IsOptional()
  @IsDateString()
  createdTo?: string;
}
