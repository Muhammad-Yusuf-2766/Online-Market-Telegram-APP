import { createApi, fetchBaseQuery, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { logout, setProfile, type AdminProfile } from '../features/auth/authSlice';
import { getParfumApiBaseUrl } from './apiBase';
import { normalizePaginated, type PaginatedResult } from './paginationNormalize';

const baseUrl = getParfumApiBaseUrl();

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as { auth: { accessToken: string | null } }).auth
      .accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithAuth: BaseQueryFn = async (args, api, extraOptions) => {
  const hadToken = Boolean(
    (api.getState() as { auth: { accessToken: string | null } }).auth.accessToken,
  );
  const result = await rawBaseQuery(args, api, extraOptions);
  const err = result.error as FetchBaseQueryError | undefined;
  if (err && err.status === 401 && hadToken) {
    api.dispatch(logout());
    api.dispatch(parfumApi.util.resetApiState());
  }
  return result;
};

export type LoginResponse = {
  accessToken: string;
  expiresIn: number;
};

export type PermissionRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RoleRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isSuperAdmin: boolean;
  memberCount: number;
  permissionCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type RoleDetail = RoleRow & {
  permissions: PermissionRow[];
};

export type AdminPanelUserRow = {
  id: string;
  email: string;
  fullName: string | null;
  isActive: boolean;
  role: {
    id: string;
    key: string;
    name: string;
    isSuperAdmin: boolean;
  } | null;
  directPermissionCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminPanelUserDetail = {
  id: string;
  email: string;
  fullName: string | null;
  isActive: boolean;
  role: (RoleRow & { permissions: PermissionRow[] }) | null;
  directPermissions: PermissionRow[];
  createdAt: string;
  updatedAt: string;
};

export type DashboardStats = {
  totals: {
    productCount: number;
    ordersInRange: number;
    newUsersInRange: number;
    cashNonCancelledUzs: number;
    coinsAppliedNonCancelledUzs: number;
    cancelledOrdersInRange: number;
    campaignSignupsInRange: number;
  };
  series: Array<{
    date: string;
    orders: number;
    newUsers: number;
    cashNonCancelledUzs: number;
    coinsAppliedNonCancelledUzs: number;
    cancelledOrderCount: number;
    campaignSignups: number;
  }>;
};

export type InsightsFunnel = {
  fromIso: string;
  toIso: string;
  steps: Array<{
    key: string;
    label: string;
    value: number;
    conversionFromPrev: number | null;
  }>;
};

export type InsightsAovLtv = {
  ordersCount: number;
  paidOrdersCount: number;
  revenueUzs: number;
  aovUzs: number;
  ltvUzs: number;
  repeatPurchaseRate: number;
};

export type InsightsTopProduct = {
  productId: string;
  title: string;
  value: number;
};

export type InsightsSearchTerm = {
  query: string;
  count: number;
  zeroResultCount: number;
};

export type SizePreset = {
  id: string;
  slug: string;
  label: string;
  grams: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductSizeOption = {
  id: string;
  presetId: string;
  label: string;
  grams: number;
  priceUzs: number;
};

export type ProductGender = 'MEN' | 'WOMEN' | 'UNISEX';

export type Product = {
  id: string;
  title: string;
  description: string;
  priceUzs: number;
  sizes: ProductSizeOption[] | null;
  images: string[];
  stock: number | null;
  stockGrams: number | null;
  maxUnitsBySizeId?: Record<string, number> | null;
  lowStockGramsThreshold: number | null;
  categoryId: string | null;
  brandId: string | null;
  familyId: string | null;
  gender: ProductGender;
  notesTop: string[];
  notesHeart: string[];
  notesBase: string[];
  isBestseller: boolean;
  isNewArrival: boolean;
  releaseYear: number | null;
  oldPriceUzs: number | null;
  discountPercent: number | null;
  lowStockThreshold: number | null;
  ratingAvg: number | null;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductListFilters = {
  q?: string;
  sort?:
    | 'newest'
    | 'price_asc'
    | 'price_desc'
    | 'title_asc'
    | 'title_desc'
    | 'rating_asc'
    | 'rating_desc'
    | 'bestselling';
  brandIds?: string[];
  categoryIds?: string[];
  familyIds?: string[];
  gender?: ProductGender;
  priceMin?: number;
  priceMax?: number;
  bestseller?: boolean;
  newArrival?: boolean;
  discounted?: boolean;
  inStockOnly?: boolean;
};

export type ProductWritePayload = {
  title: string;
  description?: string;
  priceUzs: number;
  sizes?: Array<{ presetId: string; priceUzs: number }>;
  images?: string[];
  stock?: number | null;
  stockGrams?: number | null;
  lowStockGramsThreshold?: number | null;
  categoryId?: string | null;
  brandId?: string | null;
  familyId?: string | null;
  gender?: ProductGender;
  notesTop?: string[];
  notesHeart?: string[];
  notesBase?: string[];
  isBestseller?: boolean;
  isNewArrival?: boolean;
  releaseYear?: number | null;
  oldPriceUzs?: number | null;
  discountPercent?: number | null;
  lowStockThreshold?: number | null;
};

export type FragranceFamilyRow = {
  id: string;
  slug: string;
  name: string;
};

export type PresignUploadResponse = {
  uploadUrl: string;
  key: string;
  publicUrl: string;
};

export type ProductFeedbackStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type AdminProductFeedbackRow = {
  id: string;
  productId: string;
  userId: string;
  stars: number;
  comment: string;
  status: ProductFeedbackStatus;
  createdAt: string;
  updatedAt: string;
  product: { id: string; title: string };
  user: {
    id: string;
    firstName: string | null;
    telegramUsername: string | null;
  };
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string | null;
  quantity: number;
  unitPriceUzs: number;
  titleSnapshot: string;
  sizeId: string | null;
  sizeLabelSnapshot: string | null;
  gramsSnapshot: number | null;
};

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type AdminOrder = {
  id: string;
  userId: string;
  status: OrderStatus;
  subtotalUzs: number;
  totalUzs: number;
  coinsAppliedUzs: number;
  cashPaidUzs: number;
  deliveryPhone: string | null;
  deliveryFirstName: string | null;
  deliveryLastName: string | null;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  user: {
    id: string;
    telegramId: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    birthDate: string | null;
  };
};

export type UserTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export type TelegramUser = {
  id: string;
  telegramId: string;
  telegramUsername: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  birthDate: string | null;
  gender: string;
  referralCode: string;
  referredByUserId: string | null;
  campaignId: string | null;
  tier: UserTier;
  coinBalance: number;
  locale: string;
  profileBonusBirthdateDone: boolean;
  profileBonusGenderDone: boolean;
  profileBonusLastNameDone: boolean;
  profileBonusFullDone: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ReferralTreeNode = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  referralCode: string;
  createdAt: string;
  children: ReferralTreeNode[];
};

export type RewardSettings = {
  id: string;
  referralCoins: number;
  profileBirthdayCoins: number;
  profileGenderCoins: number;
  profileLastNameCoins: number;
  profileFullCoins: number;
  updatedAt: string;
};

export type AdminCoinGiftRow = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  coins: number;
  targetUserId: string;
  createdByAdminId: string;
  createdAt: string;
  targetUser: {
    telegramId: string;
    firstName: string | null;
    lastName: string | null;
    locale: string;
  };
};

export type CoinLedgerRow = {
  id: string;
  userId: string;
  delta: number;
  kind: string;
  metadata: unknown;
  createdAt: string;
};

export type FinanceKpis = {
  grossRevenueUzs: number;
  cashCollectedUzs: number;
  coinsAppliedUzs: number;
  promoDiscountUzs: number;
  ordersCount: number;
  cancelledCount: number;
  cancelledCashUzs: number;
  aovUzs: number;
  deliveredRevenueUzs: number;
  pendingPipelineUzs: number;
};

export type FinanceReport = {
  range: { fromIso: string; toIso: string; days: number };
  previousRange?: { fromIso: string; toIso: string };
  kpis: FinanceKpis;
  kpisPrev?: FinanceKpis;
  series: Array<{
    date: string;
    grossUzs: number;
    cashUzs: number;
    coinsUzs: number;
    discountUzs: number;
    cancelledCashUzs: number;
    ordersCount: number;
    cancelledCount: number;
  }>;
  byStatus: Array<{
    status: OrderStatus;
    count: number;
    grossUzs: number;
    cashUzs: number;
    coinsUzs: number;
  }>;
  byTier: Array<{
    tier: UserTier;
    count: number;
    grossUzs: number;
    cashUzs: number;
    coinsUzs: number;
  }>;
  topCustomers: Array<{
    userId: string;
    telegramId: string;
    displayName: string;
    ordersCount: number;
    grossUzs: number;
    cashUzs: number;
    coinsUzs: number;
  }>;
  promoCodes: Array<{
    promoCodeId: string;
    code: string;
    redemptions: number;
    discountUzs: number;
    ordersCount: number;
  }>;
  coinEconomy: {
    issuedInRange: {
      total: number;
      byKind: {
        REFERRAL_EARNED: number;
        PROFILE_BONUS: number;
        ADMIN_GIFT: number;
        ADMIN_ADJUSTMENT_POSITIVE: number;
      };
    };
    redeemedInRange: number;
    refundedInRange: number;
    adminAdjustmentsNegativeInRange: number;
    netChangeInRange: number;
    outstandingLiabilityNow: number;
  };
};

export type CampaignRow = {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
  attributedUsers: number;
  miniAppUrl: string | null;
  attributedOrders: number;
  attributedRevenueUzs: number;
};

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
};

export type BrandRow = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
};

export type PromoCodeRow = {
  id: string;
  code: string;
  kind: 'PERCENT' | 'FIXED' | 'FREE_SHIPPING' | 'FIRST_ORDER';
  value: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  minOrderUzs: number | null;
};

export type UserSegmentRow = {
  id: string;
  name: string;
  definition: unknown;
  userCountCached: number;
  recomputedAt: string | null;
};

export type BroadcastRow = {
  id: string;
  title: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED';
  sentCount: number;
  errorCount: number;
  scheduledFor: string | null;
  segmentId: string;
  bodyUz: string;
  bodyRu: string;
  imageUrl: string | null;
  segment: { name: string; userCountCached: number };
  createdAt: string;
  updatedAt: string;
};

export type DashboardOverview = {
  users: {
    total: number;
    tierDistribution: Record<UserTier, number>;
    activeLast7d: number;
    coinBalanceTotal: number;
    avgCoinBalance: number;
    profileCompletionRate: number;
  };
  orders: {
    total: number;
    pendingCount: number;
    confirmedCount: number;
    shippedCount: number;
    deliveredCount: number;
    cancelledCount: number;
  };
  catalog: {
    productCount: number;
    bestsellerCount: number;
    newArrivalCount: number;
    discountedCount: number;
    averagePriceUzs: number;
  };
  inventory: {
    totalStockGrams: number;
    totalStockPieces: number;
    productsTrackedGrams: number;
    productsTrackedPieces: number;
    lowStockCount: number;
  };
  engagement: {
    wishlistCount: number;
    cartItemCount: number;
    referralRewardsCount: number;
    productFeedbackPending: number;
  };
};

export type InventorySummary = {
  productCount: number;
  totalStockGrams: number;
  totalStockPieces: number;
  productsTrackedGrams: number;
  productsTrackedPieces: number;
  outOfStockGrams: number;
  outOfStockPieces: number;
};

export type StockMovementRow = {
  id: string;
  productId: string;
  delta: number;
  deltaGrams: number;
  reason: string;
  createdAt: string;
  product: { title: string };
};

export type CampaignSlugCheck = {
  formatOk: boolean;
  available: boolean;
  previewUrl: string | null;
};

export type { PaginatedResult };

export type AdminOrdersQuery = {
  page: number;
  pageSize: number;
  status?: OrderStatus;
  createdFrom?: string;
  createdTo?: string;
};

export type AdminNotificationKind = 'ORDER_CREATED' | 'ORDER_UPDATED';

export type AdminNotificationItem = {
  id: string;
  kind: AdminNotificationKind;
  orderId: string;
  read: boolean;
  createdAt: string;
};

export const parfumApi = createApi({
  reducerPath: 'parfumApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: [
    'Product',
    'Order',
    'User',
    'Stats',
    'Notification',
    'SizePreset',
    'RewardSettings',
    'CoinGift',
    'CoinLedger',
    'Finance',
    'Campaign',
    'ProductFeedback',
    'Segment',
    'Broadcast',
    'Brand',
    'Banner',
    'Category',
    'Family',
    'PromoCode',
    'Inventory',
    'InventoryMovement',
    'UserDetail',
    'AdminPanelUser',
    'Role',
    'Permission',
  ],
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, { email: string; password: string }>({
      query: (body) => ({
        url: '/admin/auth/login',
        method: 'POST',
        body,
      }),
    }),
    getMe: build.query<AdminProfile, void>({
      query: () => '/admin/auth/me',
      keepUnusedDataFor: 0,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setProfile(data));
        } catch {
          /* handled by baseQueryWithAuth */
        }
      },
    }),
    listAdminPanelUsers: build.query<
      PaginatedResult<AdminPanelUserRow>,
      { page?: number; pageSize?: number; q?: string }
    >({
      query: (params) => ({
        url: '/admin/settings/admin-users',
        params,
      }),
      transformResponse: normalizePaginated,
      providesTags: ['AdminPanelUser'],
    }),
    getAdminPanelUser: build.query<AdminPanelUserDetail, string>({
      query: (id) => `/admin/settings/admin-users/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'AdminPanelUser', id }],
    }),
    createAdminPanelUser: build.mutation<
      AdminPanelUserDetail,
      {
        email: string;
        password: string;
        fullName?: string;
        roleId?: string;
        isActive?: boolean;
      }
    >({
      query: (body) => ({
        url: '/admin/settings/admin-users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminPanelUser'],
    }),
    updateAdminPanelUser: build.mutation<
      AdminPanelUserDetail,
      {
        id: string;
        email?: string;
        password?: string;
        fullName?: string | null;
        roleId?: string | null;
        isActive?: boolean;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/settings/admin-users/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'AdminPanelUser', id }, 'AdminPanelUser'],
    }),
    deleteAdminPanelUser: build.mutation<{ ok: boolean }, string>({
      query: (id) => ({
        url: `/admin/settings/admin-users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminPanelUser'],
    }),
    setAdminPanelUserPermissions: build.mutation<
      AdminPanelUserDetail,
      { id: string; permissionIds: string[] }
    >({
      query: ({ id, permissionIds }) => ({
        url: `/admin/settings/admin-users/${id}/permissions`,
        method: 'PUT',
        body: { permissionIds },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'AdminPanelUser', id }, 'AdminPanelUser'],
    }),
    listRoles: build.query<RoleRow[], void>({
      query: () => '/admin/settings/roles',
      providesTags: ['Role'],
    }),
    getRole: build.query<RoleDetail, string>({
      query: (id) => `/admin/settings/roles/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Role', id }],
    }),
    createRole: build.mutation<
      RoleDetail,
      { key: string; name: string; description?: string }
    >({
      query: (body) => ({
        url: '/admin/settings/roles',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Role'],
    }),
    updateRole: build.mutation<
      RoleDetail,
      { id: string; key?: string; name?: string; description?: string | null }
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/settings/roles/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Role', id }, 'Role'],
    }),
    deleteRole: build.mutation<{ ok: boolean }, string>({
      query: (id) => ({
        url: `/admin/settings/roles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Role'],
    }),
    setRolePermissions: build.mutation<
      RoleDetail,
      { id: string; permissionIds: string[] }
    >({
      query: ({ id, permissionIds }) => ({
        url: `/admin/settings/roles/${id}/permissions`,
        method: 'PUT',
        body: { permissionIds },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Role', id }, 'Role'],
    }),
    listPermissions: build.query<PermissionRow[], void>({
      query: () => '/admin/settings/permissions',
      providesTags: ['Permission'],
    }),
    createPermission: build.mutation<
      PermissionRow,
      { key: string; name: string; description?: string }
    >({
      query: (body) => ({
        url: '/admin/settings/permissions',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Permission'],
    }),
    updatePermission: build.mutation<
      PermissionRow,
      { id: string; key?: string; name?: string; description?: string | null }
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/settings/permissions/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Permission'],
    }),
    deletePermission: build.mutation<{ ok: boolean }, string>({
      query: (id) => ({
        url: `/admin/settings/permissions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Permission'],
    }),
    getDashboardStats: build.query<
      DashboardStats,
      { from: string; to: string }
    >({
      query: ({ from, to }) => ({
        url: '/admin/stats',
        params: { from, to },
      }),
      providesTags: ['Stats'],
    }),
    getInsightsFunnel: build.query<InsightsFunnel, { from: string; to: string }>({
      query: ({ from, to }) => ({
        url: '/admin/stats/insights/funnel',
        params: { from, to },
      }),
      providesTags: ['Stats'],
    }),
    getInsightsAovLtv: build.query<InsightsAovLtv, { from: string; to: string }>({
      query: ({ from, to }) => ({
        url: '/admin/stats/insights/aov-ltv',
        params: { from, to },
      }),
      providesTags: ['Stats'],
    }),
    getInsightsTopProducts: build.query<
      InsightsTopProduct[],
      { from: string; to: string; metric: 'views' | 'sales' | 'revenue' }
    >({
      query: ({ from, to, metric }) => ({
        url: '/admin/stats/insights/top-products',
        params: { from, to, metric },
      }),
      providesTags: ['Stats'],
    }),
    getInsightsSearchTerms: build.query<InsightsSearchTerm[], { from: string; to: string }>({
      query: ({ from, to }) => ({
        url: '/admin/stats/insights/search-terms',
        params: { from, to },
      }),
      providesTags: ['Stats'],
    }),
    getSizePresets: build.query<PaginatedResult<SizePreset>, { page: number; pageSize: number }>({
      query: ({ page, pageSize }) => ({
        url: '/admin/size-presets',
        params: { page, pageSize },
      }),
      transformResponse: (response: unknown, _m, arg) =>
        normalizePaginated<SizePreset>(response, { page: arg.page, pageSize: arg.pageSize }),
      providesTags: (result) =>
        result?.items?.length
          ? [
              ...result.items.map((p) => ({ type: 'SizePreset' as const, id: p.id })),
              { type: 'SizePreset', id: 'LIST' },
            ]
          : [{ type: 'SizePreset', id: 'LIST' }],
    }),
    createSizePreset: build.mutation<
      SizePreset,
      { slug: string; label: string; grams: number; sortOrder?: number }
    >({
      query: (body) => ({
        url: '/admin/size-presets',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'SizePreset', id: 'LIST' }],
    }),
    updateSizePreset: build.mutation<
      SizePreset,
      { id: string; body: Partial<{ slug: string; label: string; grams: number; sortOrder: number }> }
    >({
      query: ({ id, body }) => ({
        url: `/admin/size-presets/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'SizePreset', id },
        { type: 'SizePreset', id: 'LIST' },
      ],
    }),
    deleteSizePreset: build.mutation<{ ok: true }, string>({
      query: (id) => ({
        url: `/admin/size-presets/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'SizePreset', id: 'LIST' }],
    }),
    getProducts: build.query<
      PaginatedResult<Product>,
      { page: number; pageSize: number } & ProductListFilters
    >({
      query: ({ page, pageSize, ...filters }) => {
        const params: Record<string, string | number> = { page, pageSize };
        if (filters.q) params.q = filters.q;
        if (filters.sort) params.sort = filters.sort;
        if (filters.gender) params.gender = filters.gender;
        if (filters.priceMin !== undefined) params.priceMin = filters.priceMin;
        if (filters.priceMax !== undefined) params.priceMax = filters.priceMax;
        if (filters.bestseller) params.bestseller = 'true';
        if (filters.newArrival) params.newArrival = 'true';
        if (filters.discounted) params.discounted = 'true';
        if (filters.inStockOnly) params.inStockOnly = 'true';
        if (filters.brandIds?.length) params.brandIds = filters.brandIds.join(',');
        if (filters.categoryIds?.length) params.categoryIds = filters.categoryIds.join(',');
        if (filters.familyIds?.length) params.familyIds = filters.familyIds.join(',');
        return { url: '/products', params };
      },
      transformResponse: (response: unknown, _m, arg) =>
        normalizePaginated<Product>(response, { page: arg.page, pageSize: arg.pageSize }),
      providesTags: (result) =>
        result?.items?.length
          ? [
              ...result.items.map((p) => ({ type: 'Product' as const, id: p.id })),
              { type: 'Product', id: 'LIST' },
            ]
          : [{ type: 'Product', id: 'LIST' }],
    }),
    createProduct: build.mutation<Product, ProductWritePayload>({
      query: (body) => ({ url: '/admin/products', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Product', id: 'LIST' },
        { type: 'Inventory', id: 'LIST' },
        'Stats',
      ],
    }),
    updateProduct: build.mutation<
      Product,
      { id: string; body: Partial<ProductWritePayload> }
    >({
      query: ({ id, body }) => ({
        url: `/admin/products/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
        { type: 'Inventory', id: 'LIST' },
        'Stats',
      ],
    }),
    presignUpload: build.mutation<
      PresignUploadResponse,
      { contentType: string; keyPrefix?: string }
    >({
      query: (body) => ({
        url: '/admin/storage/presign',
        method: 'POST',
        body,
      }),
    }),
    getFragranceFamilies: build.query<FragranceFamilyRow[], void>({
      query: () => '/fragrance-families',
      providesTags: [{ type: 'Family', id: 'LIST' }],
    }),
    deleteProduct: build.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/admin/products/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
        { type: 'Inventory', id: 'LIST' },
        'Stats',
      ],
    }),
    listProductFeedback: build.query<
      PaginatedResult<AdminProductFeedbackRow>,
      { page: number; pageSize: number; status?: ProductFeedbackStatus }
    >({
      query: ({ page, pageSize, status }) => ({
        url: '/admin/product-feedback',
        params: {
          page,
          pageSize,
          ...(status ? { status } : {}),
        },
      }),
      transformResponse: (response: unknown, _m, arg) =>
        normalizePaginated<AdminProductFeedbackRow>(response, {
          page: arg.page,
          pageSize: arg.pageSize,
        }),
      providesTags: (result) =>
        result?.items?.length
          ? [
              ...result.items.map((r) => ({ type: 'ProductFeedback' as const, id: r.id })),
              { type: 'ProductFeedback', id: 'LIST' },
            ]
          : [{ type: 'ProductFeedback', id: 'LIST' }],
    }),
    patchProductFeedbackStatus: build.mutation<
      AdminProductFeedbackRow,
      { id: string; status: 'APPROVED' | 'REJECTED' }
    >({
      query: ({ id, status }) => ({
        url: `/admin/product-feedback/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result) => [
        { type: 'ProductFeedback', id: 'LIST' },
        ...(result
          ? [
              { type: 'ProductFeedback' as const, id: result.id },
              { type: 'Product' as const, id: result.productId },
            ]
          : []),
        { type: 'Product', id: 'LIST' },
      ],
    }),
    getOrders: build.query<PaginatedResult<AdminOrder>, AdminOrdersQuery>({
      query: ({ page, pageSize, status, createdFrom, createdTo }) => {
        const params: Record<string, string | number> = { page, pageSize };
        if (status) params.status = status;
        if (createdFrom) params.createdFrom = createdFrom;
        if (createdTo) params.createdTo = createdTo;
        return { url: '/admin/orders', params };
      },
      transformResponse: (response: unknown, _m, arg) =>
        normalizePaginated<AdminOrder>(response, { page: arg.page, pageSize: arg.pageSize }),
      providesTags: (result) =>
        result?.items?.length
          ? [
              ...result.items.map((o) => ({ type: 'Order' as const, id: o.id })),
              { type: 'Order', id: 'LIST' },
            ]
          : [{ type: 'Order', id: 'LIST' }],
    }),
    getAdminOrder: build.query<AdminOrder, string>({
      query: (id) => `/admin/orders/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Order', id }],
    }),
    updateOrderStatus: build.mutation<
      { id: string; status: OrderStatus; updatedAt: string },
      { id: string; status: OrderStatus }
    >({
      query: ({ id, status }) => ({
        url: `/admin/orders/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Order', id },
        { type: 'Order', id: 'LIST' },
      ],
    }),
    getUsers: build.query<
      PaginatedResult<TelegramUser>,
      { page: number; pageSize: number; q?: string; tier?: UserTier }
    >({
      query: ({ page, pageSize, q, tier }) => {
        const params: Record<string, string | number> = { page, pageSize };
        if (q) params.q = q;
        if (tier) params.tier = tier;
        return { url: '/admin/users', params };
      },
      transformResponse: (response: unknown, _m, arg) =>
        normalizePaginated<TelegramUser>(response, { page: arg.page, pageSize: arg.pageSize }),
      providesTags: (result) =>
        result?.items?.length
          ? [
              ...result.items.map((u) => ({ type: 'User' as const, id: u.id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),
    getUserReferralTree: build.query<
      ReferralTreeNode,
      { userId: string; maxDepth?: number }
    >({
      query: ({ userId, maxDepth = 5 }) => ({
        url: `/admin/users/${encodeURIComponent(userId)}/referral-tree`,
        params: { maxDepth },
      }),
    }),
    getNotifications: build.query<AdminNotificationItem[], void>({
      query: () => ({
        url: '/admin/notifications',
        params: { limit: 50 },
      }),
      providesTags: [{ type: 'Notification', id: 'LIST' }],
    }),
    markNotificationRead: build.mutation<{ ok: true }, string>({
      query: (id) => ({
        url: `/admin/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
    }),
    markAllNotificationsRead: build.mutation<{ marked: number }, void>({
      query: () => ({
        url: '/admin/notifications/read-all',
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
    }),
    getAdminRewardSettings: build.query<RewardSettings, void>({
      query: () => '/admin/settings/rewards',
      providesTags: [{ type: 'RewardSettings', id: 'SINGLE' }],
    }),
    patchAdminRewardSettings: build.mutation<
      RewardSettings,
      Partial<{
        referralCoins: number;
        profileBirthdayCoins: number;
        profileGenderCoins: number;
        profileLastNameCoins: number;
        profileFullCoins: number;
      }>
    >({
      query: (body) => ({ url: '/admin/settings/rewards', method: 'PATCH', body }),
      invalidatesTags: [{ type: 'RewardSettings', id: 'SINGLE' }],
    }),
    giftUserCoins: build.mutation<
      { id: string },
      {
        userId: string;
        title: string;
        description?: string;
        imageUrl?: string;
        coins: number;
      }
    >({
      query: ({ userId, ...body }) => ({
        url: `/admin/users/${userId}/coins/gift`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { userId }) => [
        { type: 'User', id: userId },
        { type: 'User', id: 'LIST' },
        { type: 'UserDetail', id: userId },
        { type: 'CoinGift', id: 'LIST' },
        { type: 'CoinLedger', id: 'LIST' },
      ],
    }),
    adjustUserCoins: build.mutation<
      { newBalance: number },
      { userId: string; password: string; deltaUzs: number; note?: string }
    >({
      query: ({ userId, ...body }) => ({
        url: `/admin/users/${userId}/coins/adjust`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { userId }) => [
        { type: 'User', id: userId },
        { type: 'User', id: 'LIST' },
        { type: 'UserDetail', id: userId },
        { type: 'CoinLedger', id: 'LIST' },
      ],
    }),
    getCoinGifts: build.query<PaginatedResult<AdminCoinGiftRow>, { page: number; pageSize: number }>({
      query: ({ page, pageSize }) => ({
        url: '/admin/coin-gifts',
        params: { page, pageSize },
      }),
      transformResponse: (response: unknown, _m, arg) =>
        normalizePaginated<AdminCoinGiftRow>(response, {
          page: arg.page,
          pageSize: arg.pageSize,
        }),
      providesTags: [{ type: 'CoinGift', id: 'LIST' }],
    }),
    getCoinLedger: build.query<
      PaginatedResult<CoinLedgerRow>,
      { page: number; pageSize: number; userId?: string }
    >({
      query: ({ page, pageSize, userId }) => ({
        url: '/admin/coin-ledger',
        params: { page, pageSize, ...(userId ? { userId } : {}) },
      }),
      transformResponse: (response: unknown, _m, arg) =>
        normalizePaginated<CoinLedgerRow>(response, {
          page: arg.page,
          pageSize: arg.pageSize,
        }),
      providesTags: [{ type: 'CoinLedger', id: 'LIST' }],
    }),
    getFinanceReport: build.query<
      FinanceReport,
      { from: string; to: string; compare?: boolean }
    >({
      query: ({ from, to, compare }) => ({
        url: '/admin/finance/report',
        params: { from, to, ...(compare ? { compare: true } : {}) },
      }),
      providesTags: [{ type: 'Finance', id: 'REPORT' }],
    }),
    getCampaigns: build.query<CampaignRow[], void>({
      query: () => '/admin/campaigns',
      providesTags: [{ type: 'Campaign', id: 'LIST' }],
    }),
    createCampaign: build.mutation<CampaignRow, { slug: string; name: string }>({
      query: (body) => ({ url: '/admin/campaigns', method: 'POST', body }),
      invalidatesTags: [{ type: 'Campaign', id: 'LIST' }],
    }),
    getCampaignLinkHelp: build.query<
      { template: string | null; envHints: string[] },
      void
    >({
      query: () => '/admin/campaigns/helpers/link-help',
    }),
    getCampaignSlugCheck: build.query<CampaignSlugCheck, string>({
      query: (slug) => ({
        url: '/admin/campaigns/helpers/check-slug',
        params: { slug },
      }),
    }),
    getCampaignStats: build.query<
      {
        campaign: { id: string; slug: string; name: string };
        totalAttributedUsers: number;
        signupsInRange: number;
        attributedOrders: number;
        attributedRevenueUzs: number;
        firstOrderConversionRate: number;
        series: Array<{ date: string; signups: number }>;
        sampleUrl: string | null;
      },
      { slug: string; from: string; to: string }
    >({
      query: ({ slug, from, to }) => ({
        url: `/admin/campaigns/${encodeURIComponent(slug)}/stats`,
        params: { from, to },
      }),
    }),
    getCategories: build.query<CategoryRow[], void>({
      query: () => '/categories',
      providesTags: [{ type: 'Category', id: 'LIST' }],
    }),
    createCategory: build.mutation<CategoryRow, { slug: string; name: string; parentId?: string; sortOrder?: number }>({
      query: (body) => ({ url: '/categories/admin', method: 'POST', body }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),
    getBrands: build.query<BrandRow[], void>({
      query: () => '/brands',
      providesTags: [{ type: 'Brand', id: 'LIST' }],
    }),
    createBrand: build.mutation<BrandRow, { slug: string; name: string; logoUrl?: string }>({
      query: (body) => ({ url: '/brands/admin', method: 'POST', body }),
      invalidatesTags: [{ type: 'Brand', id: 'LIST' }],
    }),
    getAdminBanners: build.query<
      Array<{
        id: string;
        imageUrl: string;
        title: string | null;
        linkUrl: string | null;
        sortOrder: number;
        isActive: boolean;
      }>,
      void
    >({
      query: () => '/admin/banners',
      providesTags: [{ type: 'Banner', id: 'LIST' }],
    }),
    createBanner: build.mutation<
      { id: string },
      {
        imageUrl: string;
        title?: string;
        linkUrl?: string;
        sortOrder?: number;
        isActive?: boolean;
        startsAt?: string;
        endsAt?: string;
      }
    >({
      query: (body) => ({ url: '/admin/banners', method: 'POST', body }),
      invalidatesTags: [{ type: 'Banner', id: 'LIST' }],
    }),
    updateBanner: build.mutation<
      { id: string },
      {
        id: string;
        imageUrl?: string;
        title?: string | null;
        linkUrl?: string | null;
        sortOrder?: number;
        isActive?: boolean;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/banners/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'Banner', id: 'LIST' }],
    }),
    deleteBanner: build.mutation<{ ok: true }, string>({
      query: (id) => ({
        url: `/admin/banners/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Banner', id: 'LIST' }],
    }),
    getPromoCodes: build.query<PromoCodeRow[], void>({
      query: () => '/promo-codes/admin',
      providesTags: [{ type: 'PromoCode', id: 'LIST' }],
    }),
    createPromoCode: build.mutation<
      PromoCodeRow,
      {
        code: string;
        kind: 'PERCENT' | 'FIXED' | 'FREE_SHIPPING' | 'FIRST_ORDER';
        value: number;
        minOrderUzs?: number;
        startsAt?: string;
        endsAt?: string;
        usageLimit?: number;
        perUserLimit?: number;
      }
    >({
      query: (body) => ({ url: '/promo-codes/admin', method: 'POST', body }),
      invalidatesTags: [{ type: 'PromoCode', id: 'LIST' }],
    }),
    getSegments: build.query<UserSegmentRow[], void>({
      query: () => '/admin/segments',
      providesTags: [{ type: 'Segment', id: 'LIST' }],
    }),
    createSegment: build.mutation<UserSegmentRow, { name: string; definition: Record<string, unknown> }>({
      query: (body) => ({ url: '/admin/segments', method: 'POST', body }),
      invalidatesTags: [{ type: 'Segment', id: 'LIST' }],
    }),
    syncSegmentMembers: build.mutation<{ synced: number }, string>({
      query: (segmentId) => ({ url: `/admin/segments/${segmentId}/sync-members`, method: 'POST' }),
      invalidatesTags: [{ type: 'Segment', id: 'LIST' }],
    }),
    addSegmentMembers: build.mutation<{ added: number }, { segmentId: string; userIds: string[] }>({
      query: ({ segmentId, userIds }) => ({
        url: `/admin/segments/${segmentId}/members`,
        method: 'POST',
        body: { userIds },
      }),
      invalidatesTags: [{ type: 'Segment', id: 'LIST' }],
    }),
    getBroadcasts: build.query<PaginatedResult<BroadcastRow>, { page: number; pageSize: number }>({
      query: ({ page, pageSize }) => ({
        url: '/admin/broadcasts',
        params: { page, pageSize },
      }),
      transformResponse: (response: unknown, _m, arg) =>
        normalizePaginated<BroadcastRow>(response, { page: arg.page, pageSize: arg.pageSize }),
      providesTags: (result) =>
        result?.items?.length
          ? [
              ...result.items.map((b) => ({ type: 'Broadcast' as const, id: b.id })),
              { type: 'Broadcast', id: 'LIST' },
            ]
          : [{ type: 'Broadcast', id: 'LIST' }],
    }),
    createBroadcast: build.mutation<
      BroadcastRow,
      {
        title: string;
        bodyUz: string;
        bodyRu: string;
        segmentId: string;
        imageUrl?: string;
        coinGiftAmount?: number;
        promoCodeId?: string;
        scheduledFor?: string;
      }
    >({
      query: (body) => ({ url: '/admin/broadcasts', method: 'POST', body }),
      invalidatesTags: [{ type: 'Broadcast', id: 'LIST' }],
    }),
    sendBroadcastNow: build.mutation<{ sent: number }, string>({
      query: (id) => ({ url: `/admin/broadcasts/${id}/send`, method: 'POST' }),
      invalidatesTags: [
        { type: 'Broadcast', id: 'LIST' },
        { type: 'Segment', id: 'LIST' },
      ],
    }),
    getDashboardOverview: build.query<DashboardOverview, void>({
      query: () => '/admin/stats/overview',
      providesTags: ['Stats'],
    }),
    getInventorySummary: build.query<InventorySummary, void>({
      query: () => '/admin/inventory/summary',
      providesTags: [{ type: 'Inventory', id: 'SUMMARY' }],
    }),
    getInventoryLowStock: build.query<Product[], void>({
      query: () => '/admin/inventory/low-stock',
      providesTags: [{ type: 'Inventory', id: 'LIST' }],
    }),
    getInventoryMovements: build.query<
      PaginatedResult<StockMovementRow>,
      { page: number; pageSize: number }
    >({
      query: ({ page, pageSize }) => ({ url: '/admin/inventory/movements', params: { page, pageSize } }),
      transformResponse: (response: unknown, _m, arg) =>
        normalizePaginated<StockMovementRow>(response, {
          page: arg.page,
          pageSize: arg.pageSize,
        }),
      providesTags: [{ type: 'InventoryMovement', id: 'LIST' }],
    }),
    adjustInventoryGrams: build.mutation<
      { stockGrams: number },
      { productId: string; deltaGrams: number; reason?: string }
    >({
      query: ({ productId, deltaGrams, reason }) => ({
        url: `/admin/inventory/${productId}/grams`,
        method: 'POST',
        body: { deltaGrams, reason },
      }),
      invalidatesTags: (_r, _e, { productId }) => [
        { type: 'Product', id: productId },
        { type: 'Product', id: 'LIST' },
        { type: 'Inventory', id: 'LIST' },
        { type: 'Inventory', id: 'SUMMARY' },
        { type: 'InventoryMovement', id: 'LIST' },
        'Stats',
      ],
    }),
    getUserDetails360: build.query<
      {
        user: TelegramUser & {
          orders: AdminOrder[];
          coinLedger: CoinLedgerRow[];
          wishlistItems: Array<{ id: string; product: Product }>;
          segmentMemberships: Array<{ segment: UserSegmentRow }>;
          adminCoinGifts: AdminCoinGiftRow[];
          productFeedbacks: Array<{
            id: string;
            stars: number;
            comment: string;
            status: ProductFeedbackStatus;
            createdAt: string;
            product: { title: string };
          }>;
          referralRewardsAsReferrer: Array<{
            id: string;
            coins: number;
            createdAt: string;
            referee: {
              id: string;
              firstName: string | null;
              lastName: string | null;
              telegramUsername: string | null;
            };
          }>;
          referredBy: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            telegramUsername: string | null;
          } | null;
          campaign: { id: string; slug: string; name: string } | null;
          promoRedemptions: Array<{
            id: string;
            discountUzs: number;
            redeemedAt: string;
            promoCode: { code: string; kind: string; value: number };
          }>;
          cart: {
            items: Array<{
              id: string;
              qty: number;
              sizeSlug: string | null;
              product: { title: string; priceUzs: number };
            }>;
          } | null;
          _count: { orders: number; referrals: number; wishlistItems: number };
        };
        kpis: {
          ordersCount: number;
          deliveredOrders: number;
          cancelledOrders: number;
          ltvUzs: number;
          aovUzs: number;
          referralCount: number;
          wishlistCount: number;
          coinsLifetimeEarned: number;
          coinsLifetimeSpent: number;
          lastOrderAt: string | null;
        };
      },
      string
    >({
      query: (userId) => `/admin/users/${userId}/details`,
      providesTags: (_r, _e, userId) => [{ type: 'UserDetail', id: userId }],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetMeQuery,
  useListAdminPanelUsersQuery,
  useGetAdminPanelUserQuery,
  useCreateAdminPanelUserMutation,
  useUpdateAdminPanelUserMutation,
  useDeleteAdminPanelUserMutation,
  useSetAdminPanelUserPermissionsMutation,
  useListRolesQuery,
  useGetRoleQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useSetRolePermissionsMutation,
  useListPermissionsQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation,
  useGetDashboardStatsQuery,
  useGetInsightsFunnelQuery,
  useGetInsightsAovLtvQuery,
  useGetInsightsTopProductsQuery,
  useGetInsightsSearchTermsQuery,
  useGetSizePresetsQuery,
  useCreateSizePresetMutation,
  useUpdateSizePresetMutation,
  useDeleteSizePresetMutation,
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  usePresignUploadMutation,
  useGetFragranceFamiliesQuery,
  useListProductFeedbackQuery,
  usePatchProductFeedbackStatusMutation,
  useGetOrdersQuery,
  useGetAdminOrderQuery,
  useUpdateOrderStatusMutation,
  useGetUsersQuery,
  useGetUserReferralTreeQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetAdminRewardSettingsQuery,
  usePatchAdminRewardSettingsMutation,
  useGiftUserCoinsMutation,
  useAdjustUserCoinsMutation,
  useGetCoinGiftsQuery,
  useGetCoinLedgerQuery,
  useGetFinanceReportQuery,
  useGetCampaignsQuery,
  useCreateCampaignMutation,
  useGetCampaignLinkHelpQuery,
  useGetCampaignSlugCheckQuery,
  useGetCampaignStatsQuery,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useGetBrandsQuery,
  useCreateBrandMutation,
  useGetAdminBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
  useGetPromoCodesQuery,
  useCreatePromoCodeMutation,
  useGetSegmentsQuery,
  useCreateSegmentMutation,
  useSyncSegmentMembersMutation,
  useAddSegmentMembersMutation,
  useGetBroadcastsQuery,
  useCreateBroadcastMutation,
  useSendBroadcastNowMutation,
  useGetInventoryLowStockQuery,
  useGetInventoryMovementsQuery,
  useGetInventorySummaryQuery,
  useAdjustInventoryGramsMutation,
  useGetDashboardOverviewQuery,
  useGetUserDetails360Query,
} = parfumApi;
