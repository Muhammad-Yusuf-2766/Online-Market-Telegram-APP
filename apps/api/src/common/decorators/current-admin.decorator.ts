import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AdminUser } from "@prisma/client";

export const CurrentAdmin = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AdminUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AdminUser }>();
    return request.user;
  },
);
