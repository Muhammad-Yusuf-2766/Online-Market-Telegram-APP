import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  collectEffectivePermissionKeys,
  isSuperAdmin,
  type AdminUserWithPermissions,
} from "./admin-user-with-permissions";
import { PERMISSIONS_METADATA_KEY } from "./require-permissions.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(
      PERMISSIONS_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AdminUserWithPermissions }>();
    const admin = request.user;
    if (!admin) {
      throw new ForbiddenException();
    }

    if (isSuperAdmin(admin)) {
      return true;
    }

    const effective = new Set(collectEffectivePermissionKeys(admin));
    const missing = required.filter((key) => !effective.has(key));
    if (missing.length > 0) {
      throw new ForbiddenException(`Missing permissions: ${missing.join(", ")}`);
    }

    return true;
  }
}
