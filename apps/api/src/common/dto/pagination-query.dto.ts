import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

/** Query: ?page=1&pageSize=20 (defaults: `paginationParams` in `common/pagination.ts`) */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
