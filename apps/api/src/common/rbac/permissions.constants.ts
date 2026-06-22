/** System permission keys — single source of truth for seed and guards. */
export const PERMISSIONS = {
  settings: {
    users: { view: "settings.users.view", manage: "settings.users.manage" },
    roles: { view: "settings.roles.view", manage: "settings.roles.manage" },
    permissions: {
      view: "settings.permissions.view",
      manage: "settings.permissions.manage",
    },
  },
  dashboard: { view: "dashboard.view" },
  insights: { view: "insights.view" },
  orders: { view: "orders.view", update: "orders.update" },
  productFeedback: {
    view: "product-feedback.view",
    manage: "product-feedback.manage",
  },
  products: { view: "products.view", manage: "products.manage" },
  sizePresets: {
    view: "size-presets.view",
    manage: "size-presets.manage",
  },
  categories: { view: "categories.view", manage: "categories.manage" },
  brands: { view: "brands.view", manage: "brands.manage" },
  banners: { view: "banners.view", manage: "banners.manage" },
  inventory: { view: "inventory.view", manage: "inventory.manage" },
  users: { view: "users.view", coinsManage: "users.coins.manage" },
  finance: { view: "finance.view", export: "finance.export" },
  rewards: { view: "rewards.view", manage: "rewards.manage" },
  coinGifts: { view: "coin-gifts.view", manage: "coin-gifts.manage" },
  coinLedger: { view: "coin-ledger.view" },
  campaigns: { view: "campaigns.view", manage: "campaigns.manage" },
  promotions: { view: "promotions.view", manage: "promotions.manage" },
  segments: { view: "segments.view", manage: "segments.manage" },
  broadcasts: { view: "broadcasts.view", manage: "broadcasts.manage" },
  automations: { view: "automations.view", manage: "automations.manage" },
  notifications: { view: "notifications.view" },
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS] extends infer T
  ? T extends Record<string, infer V>
    ? V extends string
      ? V
      : V extends Record<string, string>
        ? V[keyof V]
        : never
    : never
  : never;

function flattenPermissions(obj: Record<string, unknown>): string[] {
  const keys: string[] = [];
  for (const value of Object.values(obj)) {
    if (typeof value === "string") {
      keys.push(value);
    } else if (value && typeof value === "object") {
      keys.push(...flattenPermissions(value as Record<string, unknown>));
    }
  }
  return keys;
}

export const ALL_PERMISSION_KEYS = flattenPermissions(
  PERMISSIONS as unknown as Record<string, unknown>,
);

export type PermissionCatalogEntry = {
  key: string;
  name: string;
  description?: string;
};

export const PERMISSION_CATALOG: PermissionCatalogEntry[] = [
  { key: PERMISSIONS.settings.users.view, name: "View admin users", description: "Settings — admin users list" },
  { key: PERMISSIONS.settings.users.manage, name: "Manage admin users", description: "Create, edit, delete admin users" },
  { key: PERMISSIONS.settings.roles.view, name: "View roles", description: "Settings — roles list" },
  { key: PERMISSIONS.settings.roles.manage, name: "Manage roles", description: "Create, edit, delete roles and assign permissions" },
  { key: PERMISSIONS.settings.permissions.view, name: "View permissions", description: "Settings — permissions list" },
  { key: PERMISSIONS.settings.permissions.manage, name: "Manage permissions", description: "Create, edit, delete permissions" },
  { key: PERMISSIONS.dashboard.view, name: "View dashboard", description: "Dashboard overview" },
  { key: PERMISSIONS.insights.view, name: "View insights", description: "Analytics insights" },
  { key: PERMISSIONS.orders.view, name: "View orders", description: "Orders list and details" },
  { key: PERMISSIONS.orders.update, name: "Update orders", description: "Change order status" },
  { key: PERMISSIONS.productFeedback.view, name: "View product feedback", description: "Product reviews list" },
  { key: PERMISSIONS.productFeedback.manage, name: "Manage product feedback", description: "Approve or reject reviews" },
  { key: PERMISSIONS.products.view, name: "View products", description: "Products catalog" },
  { key: PERMISSIONS.products.manage, name: "Manage products", description: "Create, edit, delete products" },
  { key: PERMISSIONS.sizePresets.view, name: "View size presets", description: "Size presets list" },
  { key: PERMISSIONS.sizePresets.manage, name: "Manage size presets", description: "Create, edit, delete size presets" },
  { key: PERMISSIONS.categories.view, name: "View categories", description: "Categories list" },
  { key: PERMISSIONS.categories.manage, name: "Manage categories", description: "Create categories" },
  { key: PERMISSIONS.brands.view, name: "View brands", description: "Brands list" },
  { key: PERMISSIONS.brands.manage, name: "Manage brands", description: "Create brands" },
  { key: PERMISSIONS.banners.view, name: "View banners", description: "Storefront banners list" },
  { key: PERMISSIONS.banners.manage, name: "Manage banners", description: "Create and edit storefront banners" },
  { key: PERMISSIONS.inventory.view, name: "View inventory", description: "Inventory summary and movements" },
  { key: PERMISSIONS.inventory.manage, name: "Manage inventory", description: "Adjust stock grams" },
  { key: PERMISSIONS.users.view, name: "View Telegram users", description: "Customer users list and 360" },
  { key: PERMISSIONS.users.coinsManage, name: "Manage user coins", description: "Gift or adjust coins" },
  { key: PERMISSIONS.finance.view, name: "View finance", description: "Finance reports" },
  { key: PERMISSIONS.finance.export, name: "Export finance", description: "Download finance CSV" },
  { key: PERMISSIONS.rewards.view, name: "View rewards", description: "Reward settings" },
  { key: PERMISSIONS.rewards.manage, name: "Manage rewards", description: "Edit reward settings" },
  { key: PERMISSIONS.coinGifts.view, name: "View coin gifts", description: "Coin gifts list" },
  { key: PERMISSIONS.coinGifts.manage, name: "Manage coin gifts", description: "Send coin gifts" },
  { key: PERMISSIONS.coinLedger.view, name: "View coin ledger", description: "Coin ledger entries" },
  { key: PERMISSIONS.campaigns.view, name: "View campaigns", description: "Traffic campaigns" },
  { key: PERMISSIONS.campaigns.manage, name: "Manage campaigns", description: "Create campaigns" },
  { key: PERMISSIONS.promotions.view, name: "View promotions", description: "Promo codes list" },
  { key: PERMISSIONS.promotions.manage, name: "Manage promotions", description: "Create promo codes" },
  { key: PERMISSIONS.segments.view, name: "View segments", description: "User segments" },
  { key: PERMISSIONS.segments.manage, name: "Manage segments", description: "Create and sync segments" },
  { key: PERMISSIONS.broadcasts.view, name: "View broadcasts", description: "Telegram broadcasts" },
  { key: PERMISSIONS.broadcasts.manage, name: "Manage broadcasts", description: "Create and send broadcasts" },
  { key: PERMISSIONS.automations.view, name: "View automations", description: "Marketing automations" },
  { key: PERMISSIONS.automations.manage, name: "Manage automations", description: "Edit automations" },
  { key: PERMISSIONS.notifications.view, name: "View notifications", description: "Admin notification feed" },
];

export const ROLE_KEYS = {
  superAdmin: "super_admin",
  marketolog: "marketolog",
  operator: "operator",
  contentManager: "content_manager",
} as const;
