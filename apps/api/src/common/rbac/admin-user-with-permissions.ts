import type { AdminUser, Permission, Role } from "@prisma/client";

export type AdminUserWithPermissions = AdminUser & {
  role:
    | (Role & {
        permissions: { permission: Permission }[];
      })
    | null;
  directPermissions: { permission: Permission }[];
};

export function collectEffectivePermissionKeys(admin: AdminUserWithPermissions): string[] {
  const keys = new Set<string>();
  if (admin.role?.permissions) {
    for (const rp of admin.role.permissions) {
      keys.add(rp.permission.key);
    }
  }
  for (const up of admin.directPermissions) {
    keys.add(up.permission.key);
  }
  return [...keys].sort();
}

export function isSuperAdmin(admin: AdminUserWithPermissions): boolean {
  return Boolean(admin.role?.isSuperAdmin);
}

export const adminUserWithPermissionsInclude = {
  role: {
    include: {
      permissions: {
        include: { permission: true },
      },
    },
  },
  directPermissions: {
    include: { permission: true },
  },
} as const;
