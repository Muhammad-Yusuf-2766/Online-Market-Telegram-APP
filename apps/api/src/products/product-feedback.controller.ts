import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { User } from "@prisma/client";
import { JwtUserGuard } from "../auth/guards/jwt-user.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import type { PaginatedResult } from "../common/pagination";
import { CreateProductFeedbackDto } from "./dto/create-product-feedback.dto";
import { ProductFeedbackEligibilityQueryDto } from "./dto/product-feedback-eligibility-query.dto";
import {
  ProductFeedbackService,
  type ProductFeedbackSubmitEligibility,
  type PublicProductFeedback,
} from "./product-feedback.service";

@ApiTags("products")
@Controller("products")
export class ProductFeedbackController {
  constructor(private readonly productFeedback: ProductFeedbackService) {}

  @Get(":productId/feedback/submit-eligibility")
  @ApiBearerAuth("user-jwt")
  @UseGuards(JwtUserGuard)
  @ApiOperation({
    summary:
      "Whether the current user may submit feedback from this order (order must contain product; not already published)",
  })
  @ApiOkResponse({ description: "Eligibility flags" })
  async submitEligibility(
    @CurrentUser() user: User,
    @Param("productId") productId: string,
    @Query() query: ProductFeedbackEligibilityQueryDto,
  ): Promise<ProductFeedbackSubmitEligibility> {
    return this.productFeedback.getSubmitEligibility(user, productId, query.orderId);
  }

  @Get(":productId/feedback")
  @ApiOperation({ summary: "List approved product feedback (public)" })
  @ApiOkResponse({ description: "Paginated feedback" })
  async listPublic(
    @Param("productId") productId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResult<PublicProductFeedback>> {
    return this.productFeedback.listPublic(productId, query);
  }

  @Post(":productId/feedback")
  @ApiBearerAuth("user-jwt")
  @UseGuards(JwtUserGuard)
  @ApiOperation({ summary: "Submit or update feedback (pending moderation)" })
  @ApiOkResponse({ description: "Created/updated feedback id and status" })
  async submit(
    @CurrentUser() user: User,
    @Param("productId") productId: string,
    @Body() body: CreateProductFeedbackDto,
  ): Promise<{ id: string; status: string }> {
    return this.productFeedback.submit(user, productId, body);
  }
}
