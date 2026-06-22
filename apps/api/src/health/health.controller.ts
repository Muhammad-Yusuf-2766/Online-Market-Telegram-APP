import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { HealthCheck, HealthCheckError, HealthCheckService, HealthIndicatorResult } from "@nestjs/terminus";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: "Liveness/readiness (database connectivity)" })
  @ApiOkResponse({ description: "Aggregated health status" })
  check() {
    return this.health.check([() => this.prismaIndicator()]);
  }

  private async prismaIndicator(): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { database: { status: "up" } };
    } catch (error) {
      throw new HealthCheckError("Database check failed", {
        database: { status: "down", error: String(error) },
      });
    }
  }
}
