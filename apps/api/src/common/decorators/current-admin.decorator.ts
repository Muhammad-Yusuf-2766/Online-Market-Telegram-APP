import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AdminUserWithPermissions } from "../rbac/admin-user-with-permissions";

export const CurrentAdmin = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AdminUserWithPermissions => {
    const request = ctx.switchToHttp().getRequest<{ user: AdminUserWithPermissions }>();
    return request.user;
  },
);
