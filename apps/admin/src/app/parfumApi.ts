import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './store';
import { setCredentials, setProfile } from '../features/auth/authSlice';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

function normalizePaginated<T>(
  value: Paginated<T> | T[] | undefined,
  page = 1,
  pageSize = 20,
): Paginated<T> {
  if (Array.isArray(value)) {
    return { items: value, total: value.length, page, pageSize };
  }
  return value ?? { items: [], total: 0, page, pageSize };
}

export type AdminProfile = {
  id: string;
  email: string;
  fullName: string | null;
  isActive: boolean;
  isSuperAdmin: boolean;
  role: {
    id: string;
    key: string;
    name: string;
    isSuperAdmin: boolean;
  } | null;
  permissions: string[];
};

export type LoginResponse = {
  accessToken: string;
  admin: AdminProfile;
};

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type MeasurementUnit = {
  id: string;
  slug: string;
  name: string;
  symbol: string;
  sortOrder: number;
  allowDecimal: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Product = {
  id: string;
  title: string;
  description: string | null;
  priceKrw: number;
  oldPriceKrw: number | null;
  discountPercent: number | null;
  isOnSale: boolean;
  isBestSeller: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  images: string[];
  ratingAvg: number;
  ratingCount: number;
  isActive: boolean;
  categoryId: string;
  measurementUnitId: string;
  category?: CategoryRow | null;
  measurementUnit?: MeasurementUnit | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductListFilters = {
  page?: number;
  pageSize?: number;
  q?: string;
  categoryId?: string;
  isActive?: boolean;
  isOnSale?: boolean;
  isBestSeller?: boolean;
  sort?: string;
};

export type ProductWritePayload = {
  title: string;
  description?: string | null;
  priceKrw: number;
  oldPriceKrw?: number | null;
  discountPercent?: number | null;
  isOnSale?: boolean;
  isBestSeller?: boolean;
  stockQuantity: number;
  lowStockThreshold?: number;
  images?: string[];
  isActive?: boolean;
  categoryId: string;
  measurementUnitId: string;
};

export type BannerRow = {
  id: string;
  imageUrl: string;
  title: string | null;
  linkUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type MarketBranding = {
  marketName: string;
  marketSlogan: string;
  marketLogoUrl: string | null;
};

export type ProductFeedbackStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type AdminProductFeedbackRow = {
  id: string;
  productId: string;
  userId: string;
  stars: number;
  comment: string | null;
  status: ProductFeedbackStatus;
  createdAt: string;
  product: { id: string; title: string };
  user: {
    id: string;
    firstName: string | null;
    telegramUsername: string | null;
  };
};

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type AdminOrderItem = {
  id: string;
  productId: string | null;
  quantity: number;
  unitPriceKrw: number;
  titleSnapshot: string;
  imageSnapshot: string | null;
  unitNameSnapshot: string | null;
  unitSymbolSnapshot: string | null;
};

export type AdminOrder = {
  id: string;
  userId: string;
  status: OrderStatus;
  subtotalKrw: number;
  discountKrw: number;
  totalKrw: number;
  addressNameSnapshot: string | null;
  roadAddressSnapshot: string | null;
  jibunAddressSnapshot: string | null;
  buildingNameSnapshot: string | null;
  zoneNoSnapshot: string | null;
  detailAddressSnapshot: string | null;
  latitudeSnapshot: number | null;
  longitudeSnapshot: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user?: TelegramUser | null;
  items: AdminOrderItem[];
};

export type UserAddress = {
  id: string;
  label: string;
  recipientName: string | null;
  phone: string | null;
  addressName: string;
  roadAddressName: string | null;
  jibunAddressName: string | null;
  buildingName: string | null;
  zoneNo: string | null;
  detailAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TelegramUser = {
  id: string;
  telegramId: string;
  telegramUsername: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  languageCode: string | null;
  createdAt: string;
  updatedAt: string;
  addresses?: UserAddress[];
  _count?: {
    orders?: number;
    wishlistItems?: number;
    cartItems?: number;
    addresses?: number;
  };
};

export type UserDetail360 = {
  user: TelegramUser;
  addresses: UserAddress[];
  orders: AdminOrder[];
  wishlistItems: Array<{
    id: string;
    createdAt: string;
    product: Pick<Product, 'id' | 'title' | 'priceKrw' | 'images'>;
  }>;
  cartItems: Array<{
    id: string;
    qty: number;
    product: Pick<Product, 'id' | 'title' | 'priceKrw' | 'images'>;
  }>;
  kpis: {
    orderCount: number;
    totalSpentKrw: number;
    wishlistCount: number;
    cartItemCount: number;
    addressCount: number;
  };
};

export type DashboardStats = {
  totals: {
    productCount: number;
    ordersInRange: number;
    newUsersInRange: number;
    revenueKrw: number;
    cancelledOrdersInRange: number;
  };
  series: Array<{
    date: string;
    orders: number;
    newUsers: number;
    revenueKrw: number;
    cancelledOrderCount: number;
  }>;
};

export type DashboardOverview = {
  users: { total: number; newLast7d: number };
  orders: Record<'total' | 'pendingCount' | 'confirmedCount' | 'preparingCount' | 'shippedCount' | 'deliveredCount' | 'cancelledCount' | 'todayOrders', number>;
  catalog: {
    productCount: number;
    saleCount: number;
    bestsellerCount: number;
    averagePriceKrw: number;
  };
  inventory: { totalStockQuantity: number; lowStockCount: number };
  finance: { revenueKrw: number; deliveredRevenueKrw: number };
  engagement: {
    wishlistCount: number;
    cartItemCount: number;
    productFeedbackPending: number;
  };
};

export type FinanceReport = {
  range: { fromIso: string; toIso: string; days: number };
  kpis: {
    grossRevenueKrw: number;
    deliveredRevenueKrw: number;
    pendingOrderAmountKrw: number;
    cancelledOrderAmountKrw: number;
    totalOrders: number;
    averageOrderValueKrw: number;
  };
  series: Array<{ date: string; revenueKrw: number; ordersCount: number; cancelledCount: number }>;
  byStatus: Array<{ status: OrderStatus; count: number; amountKrw: number }>;
  topProducts: Array<{ productId: string; title: string; quantity: number; revenueKrw: number }>;
  topCategories: Array<{ categoryId: string; name: string; quantity: number; revenueKrw: number }>;
};

export type InventorySummary = {
  productCount: number;
  totalStockQuantity: number;
  lowStockCount: number;
  outOfStockCount: number;
};

export type InventoryMovementRow = {
  id: string;
  orderId: string | null;
  productId: string;
  delta: number;
  reason: string | null;
  createdAt: string;
  product: { title: string };
};

export type BroadcastRow = {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  targetUrl: string | null;
  status: 'DRAFT' | 'SENT' | 'FAILED' | 'SENDING';
  sentCount: number;
  errorCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminPanelUserRow = {
  id: string;
  email: string;
  fullName: string | null;
  isActive: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminPanelUserDetail = AdminPanelUserRow & {
  passwordHash?: string;
};

export type AdminNotificationItem = {
  id: string;
  kind: string;
  orderId: string;
  read: boolean;
  createdAt: string;
};

export const parfumApi = createApi({
  reducerPath: 'parfumApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    'AdminPanelUser',
    'Banner',
    'Branding',
    'Broadcast',
    'Category',
    'Finance',
    'Inventory',
    'InventoryMovement',
    'MeasurementUnit',
    'Notification',
    'Order',
    'Product',
    'ProductFeedback',
    'Stats',
    'User',
    'UserDetail',
  ],
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, { email: string; password: string }>({
      query: (body) => ({ url: '/admin/auth/login', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(setCredentials({ accessToken: data.accessToken }));
        dispatch(setProfile(data.admin));
      },
    }),
    getMe: build.query<AdminProfile, void>({
      query: () => '/admin/auth/me',
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(setProfile(data));
      },
    }),

    getDashboardStats: build.query<DashboardStats, { from?: string; to?: string } | void>({
      query: (filters) => ({ url: '/admin/stats/dashboard', params: filters ?? undefined }),
      providesTags: ['Stats'],
    }),
    getDashboardOverview: build.query<DashboardOverview, void>({
      query: () => '/admin/stats/overview',
      providesTags: ['Stats'],
    }),

    getProducts: build.query<Paginated<Product>, ProductListFilters | void>({
      query: (filters) => ({ url: '/admin/products', params: filters ?? undefined }),
      transformResponse: (value: Paginated<Product> | Product[], _meta, arg) =>
        normalizePaginated(value, arg?.page, arg?.pageSize),
      providesTags: ['Product'],
    }),
    createProduct: build.mutation<Product, ProductWritePayload>({
      query: (body) => ({ url: '/admin/products', method: 'POST', body }),
      invalidatesTags: ['Product', 'Stats', 'Inventory'],
    }),
    updateProduct: build.mutation<Product, { id: string } & Partial<ProductWritePayload>>({
      query: ({ id, ...body }) => ({ url: `/admin/products/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Product', 'Stats', 'Inventory'],
    }),
    deleteProduct: build.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/admin/products/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Product', 'Stats', 'Inventory'],
    }),
    presignUpload: build.mutation<{ uploadUrl: string; publicUrl: string }, { filename: string; contentType: string }>({
      query: (body) => ({ url: '/admin/storage/presign', method: 'POST', body }),
    }),
    uploadProductImage: build.mutation<{ url: string }, File>({
      query: (file) => {
        const body = new FormData();
        body.append('file', file);
        return { url: '/admin/uploads/product-images', method: 'POST', body };
      },
    }),
    uploadBannerImage: build.mutation<{ url: string }, File>({
      query: (file) => {
        const body = new FormData();
        body.append('file', file);
        return { url: '/admin/uploads/banner-images', method: 'POST', body };
      },
    }),
    uploadBrandingLogo: build.mutation<{ url: string }, File>({
      query: (file) => {
        const body = new FormData();
        body.append('file', file);
        return { url: '/admin/uploads/branding-logo', method: 'POST', body };
      },
    }),

    getMarketBranding: build.query<MarketBranding, void>({
      query: () => '/admin/settings/branding',
      providesTags: ['Branding'],
    }),
    updateMarketBranding: build.mutation<MarketBranding, Partial<MarketBranding>>({
      query: (body) => ({ url: '/admin/settings/branding', method: 'PATCH', body }),
      invalidatesTags: ['Branding'],
    }),

    getCategories: build.query<CategoryRow[], void>({
      query: () => '/admin/categories',
      providesTags: ['Category'],
    }),
    createCategory: build.mutation<CategoryRow, Partial<CategoryRow> & { slug: string; name: string }>({
      query: (body) => ({ url: '/admin/categories', method: 'POST', body }),
      invalidatesTags: ['Category', 'Product'],
    }),
    updateCategory: build.mutation<CategoryRow, { id: string } & Partial<CategoryRow>>({
      query: ({ id, ...body }) => ({ url: `/admin/categories/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Category', 'Product'],
    }),
    deleteCategory: build.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/admin/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Category', 'Product'],
    }),

    getMeasurementUnits: build.query<MeasurementUnit[], void>({
      query: () => '/admin/measurement-units',
      providesTags: ['MeasurementUnit'],
    }),
    createMeasurementUnit: build.mutation<MeasurementUnit, { slug: string; name: string; symbol: string; sortOrder?: number; allowDecimal?: boolean }>({
      query: (body) => ({ url: '/admin/measurement-units', method: 'POST', body }),
      invalidatesTags: ['MeasurementUnit', 'Product'],
    }),
    updateMeasurementUnit: build.mutation<MeasurementUnit, { id: string; slug?: string; name?: string; symbol?: string; sortOrder?: number; allowDecimal?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/admin/measurement-units/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['MeasurementUnit', 'Product'],
    }),
    deleteMeasurementUnit: build.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/admin/measurement-units/${id}`, method: 'DELETE' }),
      invalidatesTags: ['MeasurementUnit', 'Product'],
    }),

    getAdminBanners: build.query<BannerRow[], void>({
      query: () => '/admin/banners',
      providesTags: ['Banner'],
    }),
    createBanner: build.mutation<BannerRow, Partial<BannerRow> & { imageUrl: string }>({
      query: (body) => ({ url: '/admin/banners', method: 'POST', body }),
      invalidatesTags: ['Banner'],
    }),
    updateBanner: build.mutation<BannerRow, { id: string } & Partial<BannerRow>>({
      query: ({ id, ...body }) => ({ url: `/admin/banners/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Banner'],
    }),
    deleteBanner: build.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/admin/banners/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Banner'],
    }),

    listProductFeedback: build.query<Paginated<AdminProductFeedbackRow>, { page?: number; pageSize?: number; status?: ProductFeedbackStatus } | void>({
      query: (filters) => ({ url: '/admin/product-feedback', params: filters ?? undefined }),
      transformResponse: (value: Paginated<AdminProductFeedbackRow> | AdminProductFeedbackRow[], _meta, arg) =>
        normalizePaginated(value, arg?.page, arg?.pageSize),
      providesTags: ['ProductFeedback'],
    }),
    patchProductFeedbackStatus: build.mutation<AdminProductFeedbackRow, { id: string; status: ProductFeedbackStatus }>({
      query: ({ id, status }) => ({
        url: `/admin/product-feedback/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['ProductFeedback', 'Product'],
    }),

    getOrders: build.query<Paginated<AdminOrder>, { page?: number; pageSize?: number; status?: OrderStatus; q?: string } | void>({
      query: (filters) => ({ url: '/admin/orders', params: filters ?? undefined }),
      transformResponse: (value: Paginated<AdminOrder> | AdminOrder[], _meta, arg) =>
        normalizePaginated(value, arg?.page, arg?.pageSize),
      providesTags: ['Order'],
    }),
    getAdminOrder: build.query<AdminOrder, string>({
      query: (id) => `/admin/orders/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Order', id }],
    }),
    updateOrderStatus: build.mutation<AdminOrder, { id: string; status: OrderStatus }>({
      query: ({ id, status }) => ({
        url: `/admin/orders/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Order', 'Stats', 'Finance', 'Inventory'],
    }),

    getUsers: build.query<Paginated<TelegramUser>, { page?: number; pageSize?: number; q?: string } | void>({
      query: (filters) => ({ url: '/admin/users', params: filters ?? undefined }),
      transformResponse: (value: Paginated<TelegramUser> | TelegramUser[], _meta, arg) =>
        normalizePaginated(value, arg?.page, arg?.pageSize),
      providesTags: ['User'],
    }),
    getUserDetails360: build.query<UserDetail360, string>({
      query: (userId) => `/admin/users/${encodeURIComponent(userId)}/details`,
      providesTags: (_result, _error, id) => [{ type: 'UserDetail', id }],
    }),

    getNotifications: build.query<AdminNotificationItem[], void>({
      query: () => '/admin/notifications',
      providesTags: ['Notification', { type: 'Notification', id: 'LIST' }],
    }),
    markNotificationRead: build.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/admin/notifications/${id}/read`, method: 'POST' }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsRead: build.mutation<{ ok: boolean }, void>({
      query: () => ({ url: '/admin/notifications/read-all', method: 'POST' }),
      invalidatesTags: ['Notification'],
    }),

    getFinanceReport: build.query<FinanceReport, { from?: string; to?: string } | void>({
      query: (filters) => ({ url: '/admin/finance/report', params: filters ?? undefined }),
      providesTags: ['Finance'],
    }),

    getInventorySummary: build.query<InventorySummary, void>({
      query: () => '/admin/inventory/summary',
      providesTags: ['Inventory'],
    }),
    getInventoryLowStock: build.query<Product[], void>({
      query: () => '/admin/inventory/low-stock',
      providesTags: ['Inventory'],
    }),
    getInventoryMovements: build.query<Paginated<InventoryMovementRow>, { page?: number; pageSize?: number } | void>({
      query: (filters) => ({ url: '/admin/inventory/movements', params: filters ?? undefined }),
      transformResponse: (value: Paginated<InventoryMovementRow> | InventoryMovementRow[], _meta, arg) =>
        normalizePaginated(value, arg?.page, arg?.pageSize),
      providesTags: ['InventoryMovement'],
    }),
    adjustInventory: build.mutation<{ stockQuantity: number }, { productId: string; delta: number; reason?: string }>({
      query: ({ productId, ...body }) => ({
        url: `/admin/inventory/${productId}/adjust`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Inventory', 'InventoryMovement', 'Product'],
    }),

    getBroadcasts: build.query<BroadcastRow[], void>({
      query: () => '/admin/broadcasts',
      transformResponse: (value: Paginated<BroadcastRow> | BroadcastRow[]) =>
        normalizePaginated(value).items,
      providesTags: ['Broadcast'],
    }),
    createBroadcast: build.mutation<BroadcastRow, { title: string; body: string; imageUrl?: string | null; targetUrl?: string | null }>({
      query: (body) => ({ url: '/admin/broadcasts', method: 'POST', body }),
      invalidatesTags: ['Broadcast'],
    }),
    sendBroadcastNow: build.mutation<{ sent: number; errors: number }, string>({
      query: (id) => ({ url: `/admin/broadcasts/${id}/send`, method: 'POST' }),
      invalidatesTags: ['Broadcast'],
    }),
    deleteBroadcast: build.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/admin/broadcasts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Broadcast'],
    }),

    listAdminPanelUsers: build.query<Paginated<AdminPanelUserRow>, { page?: number; pageSize?: number; q?: string } | void>({
      query: (filters) => ({ url: '/admin/settings/admin-users', params: filters ?? undefined }),
      transformResponse: (value: Paginated<AdminPanelUserRow> | AdminPanelUserRow[], _meta, arg) =>
        normalizePaginated(value, arg?.page, arg?.pageSize),
      providesTags: ['AdminPanelUser'],
    }),
    getAdminPanelUser: build.query<AdminPanelUserDetail, string>({
      query: (id) => `/admin/settings/admin-users/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'AdminPanelUser', id }],
    }),
    createAdminPanelUser: build.mutation<AdminPanelUserRow, { email: string; password: string; fullName?: string | null; isActive?: boolean }>({
      query: (body) => ({ url: '/admin/settings/admin-users', method: 'POST', body }),
      invalidatesTags: ['AdminPanelUser'],
    }),
    updateAdminPanelUser: build.mutation<AdminPanelUserRow, { id: string; email?: string; password?: string; fullName?: string | null; isActive?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/admin/settings/admin-users/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['AdminPanelUser'],
    }),
    deleteAdminPanelUser: build.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/admin/settings/admin-users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AdminPanelUser'],
    }),
  }),
});

export const {
  useAdjustInventoryMutation,
  useCreateAdminPanelUserMutation,
  useCreateBannerMutation,
  useCreateBroadcastMutation,
  useCreateCategoryMutation,
  useCreateMeasurementUnitMutation,
  useCreateProductMutation,
  useDeleteAdminPanelUserMutation,
  useDeleteBannerMutation,
  useDeleteBroadcastMutation,
  useDeleteCategoryMutation,
  useDeleteMeasurementUnitMutation,
  useDeleteProductMutation,
  useGetAdminBannersQuery,
  useGetAdminOrderQuery,
  useGetAdminPanelUserQuery,
  useGetBroadcastsQuery,
  useGetCategoriesQuery,
  useGetDashboardOverviewQuery,
  useGetDashboardStatsQuery,
  useGetFinanceReportQuery,
  useGetInventoryLowStockQuery,
  useGetInventoryMovementsQuery,
  useGetInventorySummaryQuery,
  useGetMarketBrandingQuery,
  useGetMeQuery,
  useGetMeasurementUnitsQuery,
  useGetNotificationsQuery,
  useGetOrdersQuery,
  useGetProductsQuery,
  useGetUserDetails360Query,
  useGetUsersQuery,
  useListAdminPanelUsersQuery,
  useListProductFeedbackQuery,
  useLoginMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  usePatchProductFeedbackStatusMutation,
  usePresignUploadMutation,
  useSendBroadcastNowMutation,
  useUpdateAdminPanelUserMutation,
  useUpdateBannerMutation,
  useUpdateCategoryMutation,
  useUpdateMarketBrandingMutation,
  useUpdateMeasurementUnitMutation,
  useUpdateOrderStatusMutation,
  useUpdateProductMutation,
  useUploadBannerImageMutation,
  useUploadBrandingLogoMutation,
  useUploadProductImageMutation,
} = parfumApi;
