import type { PrismaClient } from "@prisma/client";

/** Self-contained RBAC seed data (no import from src — works in Docker prod builds). */
const ROLE_KEYS = {
  superAdmin: "super_admin",
  marketolog: "marketolog",
  operator: "operator",
  contentManager: "content_manager",
} as const;

const PERMISSION_CATALOG: Array<{ key: string; name: string; description?: string }> = [
  { key: "settings.users.view", name: "View admin users" },
  { key: "settings.users.manage", name: "Manage admin users" },
  { key: "settings.roles.view", name: "View roles" },
  { key: "settings.roles.manage", name: "Manage roles" },
  { key: "settings.permissions.view", name: "View permissions" },
  { key: "settings.permissions.manage", name: "Manage permissions" },
  { key: "dashboard.view", name: "View dashboard" },
  { key: "insights.view", name: "View insights" },
  { key: "orders.view", name: "View orders" },
  { key: "orders.update", name: "Update orders" },
  { key: "product-feedback.view", name: "View product feedback" },
  { key: "product-feedback.manage", name: "Manage product feedback" },
  { key: "products.view", name: "View products" },
  { key: "products.manage", name: "Manage products" },
  { key: "size-presets.view", name: "View size presets" },
  { key: "size-presets.manage", name: "Manage size presets" },
  { key: "categories.view", name: "View categories" },
  { key: "categories.manage", name: "Manage categories" },
  { key: "brands.view", name: "View brands" },
  { key: "brands.manage", name: "Manage brands" },
  { key: "banners.view", name: "View banners" },
  { key: "banners.manage", name: "Manage banners" },
  { key: "inventory.view", name: "View inventory" },
  { key: "inventory.manage", name: "Manage inventory" },
  { key: "users.view", name: "View Telegram users" },
  { key: "users.coins.manage", name: "Manage user coins" },
  { key: "finance.view", name: "View finance" },
  { key: "finance.export", name: "Export finance" },
  { key: "rewards.view", name: "View rewards" },
  { key: "rewards.manage", name: "Manage rewards" },
  { key: "coin-gifts.view", name: "View coin gifts" },
  { key: "coin-gifts.manage", name: "Manage coin gifts" },
  { key: "coin-ledger.view", name: "View coin ledger" },
  { key: "campaigns.view", name: "View campaigns" },
  { key: "campaigns.manage", name: "Manage campaigns" },
  { key: "promotions.view", name: "View promotions" },
  { key: "promotions.manage", name: "Manage promotions" },
  { key: "segments.view", name: "View segments" },
  { key: "segments.manage", name: "Manage segments" },
  { key: "broadcasts.view", name: "View broadcasts" },
  { key: "broadcasts.manage", name: "Manage broadcasts" },
  { key: "automations.view", name: "View automations" },
  { key: "automations.manage", name: "Manage automations" },
  { key: "notifications.view", name: "View notifications" },
];

const ALL_PERMISSION_KEYS = PERMISSION_CATALOG.map((p) => p.key);

const ROLE_DEFINITIONS = [
  {
    key: ROLE_KEYS.superAdmin,
    name: "Super Admin",
    description: "Full access to all admin features",
    isSystem: true,
    isSuperAdmin: true,
    permissionKeys: ALL_PERMISSION_KEYS,
  },
  {
    key: ROLE_KEYS.marketolog,
    name: "Marketolog",
    description: "Marketing tools, analytics, and customer users",
    isSystem: true,
    isSuperAdmin: false,
    permissionKeys: [
      "dashboard.view",
      "insights.view",
      "users.view",
      "finance.view",
      "rewards.view",
      "rewards.manage",
      "coin-gifts.view",
      "coin-gifts.manage",
      "coin-ledger.view",
      "campaigns.view",
      "campaigns.manage",
      "promotions.view",
      "promotions.manage",
      "segments.view",
      "segments.manage",
      "broadcasts.view",
      "broadcasts.manage",
      "automations.view",
      "automations.manage",
      "notifications.view",
    ],
  },
  {
    key: ROLE_KEYS.operator,
    name: "Operator",
    description: "Orders and product feedback only",
    isSystem: true,
    isSuperAdmin: false,
    permissionKeys: [
      "dashboard.view",
      "orders.view",
      "orders.update",
      "product-feedback.view",
      "product-feedback.manage",
      "notifications.view",
    ],
  },
  {
    key: ROLE_KEYS.contentManager,
    name: "Kontent menejer",
    description: "Product settings and inventory",
    isSystem: true,
    isSuperAdmin: false,
    permissionKeys: [
      "dashboard.view",
      "products.view",
      "products.manage",
      "size-presets.view",
      "size-presets.manage",
      "categories.view",
      "categories.manage",
      "brands.view",
      "brands.manage",
      "banners.view",
      "banners.manage",
      "inventory.view",
      "inventory.manage",
      "notifications.view",
    ],
  },
] as const;

export async function seedRbac(prisma: PrismaClient, adminEmail: string): Promise<void> {
  const permissionIdByKey = new Map<string, string>();

  for (const entry of PERMISSION_CATALOG) {
    const row = await prisma.permission.upsert({
      where: { key: entry.key },
      create: {
        key: entry.key,
        name: entry.name,
        description: entry.description ?? null,
        isSystem: true,
      },
      update: {
        name: entry.name,
        description: entry.description ?? null,
        isSystem: true,
      },
    });
    permissionIdByKey.set(entry.key, row.id);
  }

  for (const roleDef of ROLE_DEFINITIONS) {
    const role = await prisma.role.upsert({
      where: { key: roleDef.key },
      create: {
        key: roleDef.key,
        name: roleDef.name,
        description: roleDef.description,
        isSystem: roleDef.isSystem,
        isSuperAdmin: roleDef.isSuperAdmin,
      },
      update: {
        name: roleDef.name,
        description: roleDef.description,
        isSystem: roleDef.isSystem,
        isSuperAdmin: roleDef.isSuperAdmin,
      },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

    const permissionIds = roleDef.permissionKeys
      .map((key) => permissionIdByKey.get(key))
      .filter((id): id is string => Boolean(id));

    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: role.id,
          permissionId,
        })),
        skipDuplicates: true,
      });
    }
  }

  const superAdminRole = await prisma.role.findUnique({
    where: { key: ROLE_KEYS.superAdmin },
  });

  if (superAdminRole) {
    await prisma.adminUser.updateMany({
      where: { email: adminEmail.toLowerCase() },
      data: { roleId: superAdminRole.id, isActive: true },
    });
  }

  console.log("Seeded RBAC permissions, roles, and assigned super_admin to seed admin.");
}
