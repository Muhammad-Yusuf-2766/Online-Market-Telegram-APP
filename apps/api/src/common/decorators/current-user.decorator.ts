import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { User } from "@prisma/client";

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest<{ user: User }>();
  return request.user;
});
