import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";

const moderationStatuses = ["APPROVED", "REJECTED"] as const;

export class PatchProductFeedbackStatusDto {
  @ApiProperty({ enum: [...moderationStatuses] })
  @IsIn([...moderationStatuses])
  status!: (typeof moderationStatuses)[number];
}
