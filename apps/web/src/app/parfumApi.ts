import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
} from '@reduxjs/toolkit/query/react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { logout } from '../features/auth/authSlice';
import type { TelegramAuthUser } from '../features/auth/authSlice';
import { normalizePaginated } from './paginationNormalize';

export function getParfumApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (import.meta.env.DEV) return '/_ansor-api';
  if (typeof window !== 'undefined') {
    console.warn(
      '[ansorApi] VITE_API_BASE_URL was not set at build time. Falling back to same-origin requests.',
    );
  }
  return '';
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: getParfumApiBaseUrl(),
  prepareHeaders: (headers, { getState }) => {
    const token = (
      getState() as { auth: { accessToken: string | null } }
    ).auth.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

const baseQueryWithAuth: BaseQueryFn = async (args, api, extraOptions) => {
  const hadToken = Boolean(
    (api.getState() as { auth: { accessToken: string | null } }).auth
      .accessToken,
  );
  const result = await rawBaseQuery(args, api, extraOptions);
  const err = result.error as FetchBaseQueryError | undefined;
  if (err && err.status === 401 && hadToken) {
    api.dispatch(logout());
  }
  return result;
};

export type MeasurementUnit = {
  id: string;
  slug: string;
  name: string;
  symbol: string;
  sortOrder?: number;
  allowDecimal: boolean;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  parentId?: string | null;
  sortOrder?: number;
};

export type Product = {
  id: string;
  title: string;
  description: string;
  priceKrw: number;
  oldPriceKrw?: number | null;
  discountPercent?: number | null;
  isOnSale: boolean;
  isBestSeller: boolean;
  stockQuantity: number;
  lowStockThreshold?: number | null;
  images: string[];
  ratingAvg: number | null;
  ratingCount: number;
  isActive: boolean;
  categoryId: string;
  measurementUnitId: string;
  category?: Category;
  measurementUnit?: MeasurementUnit;
  createdAt: string;
  updatedAt: string;
};

export const productListSortValues = [
  'newest',
  'price_asc',
  'price_desc',
  'title_asc',
  'title_desc',
  'rating_asc',
  'rating_desc',
  'bestselling',
] as const;
export type ProductListSort = (typeof productListSortValues)[number];

export type ProductFeedbackPublic = {
  id: string;
  stars: number;
  comment: string;
  createdAt: string;
  authorDisplay: string;
};

export type ProductFeedbackSubmitEligibility = {
  canSubmit: boolean;
  reason:
    | 'ORDER_DETAIL_REQUIRED'
    | 'INVALID_ORDER_CONTEXT'
    | 'ORDER_NOT_DELIVERED'
    | 'ALREADY_PUBLISHED'
    | null;
};

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string | null;
  quantity: number;
  unitPriceKrw: number;
  titleSnapshot: string;
  imageSnapshot: string | null;
  unitNameSnapshot: string | null;
  unitSymbolSnapshot: string | null;
};

export type Order = {
  id: string;
  userId: string;
  status: OrderStatus;
  subtotalKrw: number;
  totalKrw: number;
  discountKrw: number;
  deliveryPhone: string | null;
  deliveryFirstName: string | null;
  deliveryLastName: string | null;
  addressId: string | null;
  addressNameSnapshot: string;
  roadAddressSnapshot: string | null;
  jibunAddressSnapshot: string | null;
  buildingNameSnapshot: string | null;
  zoneNoSnapshot: string | null;
  detailAddressSnapshot: string;
  latitudeSnapshot: number | null;
  longitudeSnapshot: number | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

export type UserGender =
  | 'UNSPECIFIED'
  | 'MALE'
  | 'FEMALE'
  | 'OTHER';

export type UserProfile = {
  id: string;
  telegramId: string;
  telegramUsername: string | null;
  firstName: string | null;
  lastName: string | null;
  locale: 'ru' | 'uz';
  phone: string | null;
  birthDate: string | null;
  gender: UserGender;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserAddress = {
  id: string;
  userId: string;
  label: string | null;
  recipientName: string | null;
  phone: string | null;
  addressName: string;
  roadAddressName: string | null;
  jibunAddressName: string | null;
  buildingName: string | null;
  zoneNo: string | null;
  detailAddress: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AddressSearchResult = {
  addressName: string;
  roadAddressName: string | null;
  jibunAddressName: string | null;
  buildingName: string | null;
  zoneNo: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type Banner = {
  id: string;
  imageUrl: string;
  title: string | null;
  linkUrl: string | null;
  sortOrder: number;
};

export type UserNotification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  imageUrl: string | null;
  targetUrl: string | null;
  readAt: string | null;
  createdAt: string;
};

export type WishlistItem = {
  id: string;
  productId: string;
  notifyBackInStock: boolean;
  notifyPriceDrop: boolean;
  product: Product;
};

export type CartItemDto = {
  id: string;
  productId: string;
  qty: number;
  updatedAt: string;
  product: Pick<
    Product,
    'id' | 'title' | 'priceKrw' | 'stockQuantity' | 'images'
  > & {
    measurementUnit?: Pick<MeasurementUnit, 'id' | 'name' | 'symbol'>;
  };
};

export type CartDto = {
  id: string;
  userId: string;
  updatedAt: string;
  items: CartItemDto[];
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type TelegramAuthResponse = {
  accessToken: string;
  expiresIn: number;
  user: TelegramAuthUser;
};

export const parfumApi = createApi({
  reducerPath: 'parfumApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: [
    'Product',
    'ProductFeedback',
    'Order',
    'UserProfile',
    'UserAddress',
    'Wishlist',
    'Notification',
    'Banner',
    'Cart',
    'MeasurementUnit',
  ],
  invalidationBehavior: 'immediately',
  endpoints: (build) => ({
    exchangeTelegram: build.mutation<
      TelegramAuthResponse,
      { initDataRaw: string }
    >({
      query: (body) => ({ url: '/auth/telegram', method: 'POST', body }),
    }),
    getProducts: build.query<
      PaginatedResult<Product>,
      {
        page: number;
        pageSize: number;
        q?: string;
        sort?: ProductListSort;
        categorySlug?: string;
        categoryIds?: string;
        priceMin?: number;
        priceMax?: number;
        inStockOnly?: boolean;
        bestseller?: boolean;
        onSale?: boolean;
      }
    >({
      query: ({
        page,
        pageSize,
        q,
        sort,
        categorySlug,
        categoryIds,
        priceMin,
        priceMax,
        inStockOnly,
        bestseller,
        onSale,
      }) => ({
        url: '/products',
        params: {
          page,
          pageSize,
          ...(q?.trim() ? { q: q.trim() } : {}),
          ...(sort && sort !== 'newest' ? { sort } : {}),
          ...(categorySlug ? { categorySlug } : {}),
          ...(categoryIds ? { categoryIds } : {}),
          ...(priceMin != null ? { priceMin } : {}),
          ...(priceMax != null ? { priceMax } : {}),
          ...(inStockOnly ? { inStockOnly: true } : {}),
          ...(bestseller ? { bestseller: true } : {}),
          ...(onSale ? { onSale: true } : {}),
        },
      }),
      transformResponse: (response: unknown, _m, arg) =>
        normalizePaginated<Product>(response, {
          page: arg.page,
          pageSize: arg.pageSize,
        }),
      providesTags: (result) =>
        result?.items?.length
          ? [
              ...result.items.map((p) => ({ type: 'Product' as const, id: p.id })),
              { type: 'Product', id: 'LIST' },
            ]
          : [{ type: 'Product', id: 'LIST' }],
    }),
    getSaleProducts: build.query<
      PaginatedResult<Product>,
      { page: number; pageSize: number }
    >({
      query: ({ page, pageSize }) => ({
        url: '/products/sections/sale',
        params: { page, pageSize },
      }),
      transformResponse: (response: unknown, _m, arg) =>
        normalizePaginated<Product>(response, arg),
      providesTags: [{ type: 'Product', id: 'SALE' }],
    }),
    getBestsellerProducts: build.query<
      PaginatedResult<Product>,
      { page: number; pageSize: number }
    >({
      query: ({ page, pageSize }) => ({
        url: '/products/sections/bestseller',
        params: { page, pageSize },
      }),
      transformResponse: (response: unknown, _m, arg) =>
        normalizePaginated<Product>(response, arg),
      providesTags: [{ type: 'Product', id: 'BESTSELLER' }],
    }),
    getProduct: build.query<Product, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Product', id }],
    }),
    getCategories: build.query<Category[], void>({ query: () => '/categories' }),
    getMeasurementUnits: build.query<MeasurementUnit[], void>({
      query: () => '/measurement-units',
      providesTags: [{ type: 'MeasurementUnit', id: 'LIST' }],
    }),
    getBanners: build.query<Banner[], void>({
      query: () => '/banners',
      providesTags: [{ type: 'Banner', id: 'LIST' }],
    }),
    getProductFeedbackSubmitEligibility: build.query<
      ProductFeedbackSubmitEligibility,
      { productId: string; orderId: string }
    >({
      query: ({ productId, orderId }) => ({
        url: `/products/${productId}/feedback/submit-eligibility`,
        params: { orderId },
      }),
      providesTags: (_r, _e, arg) => [
        {
          type: 'ProductFeedback',
          id: `eligibility-${arg.orderId}-${arg.productId}`,
        },
      ],
    }),
    getProductFeedback: build.query<
      PaginatedResult<ProductFeedbackPublic>,
      { productId: string; page: number; pageSize: number }
    >({
      query: ({ productId, page, pageSize }) => ({
        url: `/products/${productId}/feedback`,
        params: { page, pageSize },
      }),
      transformResponse: (response: unknown, _m, arg) =>
        normalizePaginated<ProductFeedbackPublic>(response, arg),
      providesTags: (_r, _e, arg) => [
        { type: 'ProductFeedback', id: arg.productId },
      ],
    }),
    submitProductFeedback: build.mutation<
      { id: string; status: string },
      { productId: string; orderId: string; stars: number; comment?: string }
    >({
      query: ({ productId, orderId, stars, comment }) => ({
        url: `/products/${productId}/feedback`,
        method: 'POST',
        body: { orderId, stars, comment: comment?.trim() || undefined },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Product', id: arg.productId },
        { type: 'Product', id: 'LIST' },
        { type: 'ProductFeedback', id: arg.productId },
        { type: 'Order', id: arg.orderId },
        {
          type: 'ProductFeedback',
          id: `eligibility-${arg.orderId}-${arg.productId}`,
        },
      ],
    }),
    getMe: build.query<UserProfile, void>({
      query: () => '/users/me',
      providesTags: [{ type: 'UserProfile', id: 'ME' }],
    }),
    patchMe: build.mutation<
      UserProfile,
      Partial<{
        phone: string;
        firstName: string;
        lastName: string;
        birthDate: string;
        locale: 'ru' | 'uz';
        gender: UserGender;
      }>
    >({
      query: (body) => ({ url: '/users/me', method: 'PATCH', body }),
      invalidatesTags: [{ type: 'UserProfile', id: 'ME' }],
    }),
    getUserAddresses: build.query<UserAddress[], void>({
      query: () => '/users/me/addresses',
      providesTags: [{ type: 'UserAddress', id: 'LIST' }],
    }),
    createUserAddress: build.mutation<
      UserAddress,
      Omit<UserAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
    >({
      query: (body) => ({ url: '/users/me/addresses', method: 'POST', body }),
      invalidatesTags: [{ type: 'UserAddress', id: 'LIST' }],
    }),
    updateUserAddress: build.mutation<
      UserAddress,
      { id: string; patch: Partial<Omit<UserAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> }
    >({
      query: ({ id, patch }) => ({
        url: `/users/me/addresses/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: [{ type: 'UserAddress', id: 'LIST' }],
    }),
    deleteUserAddress: build.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/users/me/addresses/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'UserAddress', id: 'LIST' }],
    }),
    searchAddresses: build.query<AddressSearchResult[], string>({
      query: (q) => ({ url: '/addresses/search', params: { q } }),
    }),
    getWishlist: build.query<WishlistItem[], void>({
      query: () => '/wishlist',
      providesTags: [{ type: 'Wishlist', id: 'LIST' }],
    }),
    toggleWishlist: build.mutation<{ added: boolean }, { productId: string }>({
      query: (body) => ({ url: '/wishlist/toggle', method: 'POST', body }),
      invalidatesTags: [{ type: 'Wishlist', id: 'LIST' }],
    }),
    updateWishlistPrefs: build.mutation<
      WishlistItem,
      { productId: string; notifyBackInStock?: boolean; notifyPriceDrop?: boolean }
    >({
      query: (body) => ({ url: '/wishlist/notify-prefs', method: 'PATCH', body }),
      invalidatesTags: [{ type: 'Wishlist', id: 'LIST' }],
    }),
    getMyNotifications: build.query<
      PaginatedResult<UserNotification> & { unreadCount: number },
      { page: number; pageSize: number }
    >({
      query: ({ page, pageSize }) => ({
        url: '/users/me/notifications',
        params: { page, pageSize },
      }),
      transformResponse: (response: unknown, _m, arg) => {
        const r = response as PaginatedResult<UserNotification> & {
          unreadCount?: number;
        };
        return {
          ...normalizePaginated<UserNotification>(r, arg),
          unreadCount: r.unreadCount ?? 0,
        };
      },
      providesTags: [{ type: 'Notification', id: 'LIST' }],
    }),
    markNotificationRead: build.mutation<{ ok: true }, string>({
      query: (id) => ({
        url: `/users/me/notifications/${id}/read`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
    }),
    markAllNotificationsRead: build.mutation<{ ok: true }, void>({
      query: () => ({ url: '/users/me/notifications/read-all', method: 'POST' }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
    }),
    getCart: build.query<CartDto, void>({
      query: () => '/cart',
      providesTags: [{ type: 'Cart', id: 'CURRENT' }],
    }),
    upsertCartItem: build.mutation<CartDto, { productId: string; qty: number }>({
      query: (body) => ({ url: '/cart/items', method: 'POST', body }),
      invalidatesTags: [{ type: 'Cart', id: 'CURRENT' }],
    }),
    updateCartItemQty: build.mutation<CartDto, { itemId: string; qty: number }>({
      query: ({ itemId, qty }) => ({
        url: `/cart/items/${itemId}`,
        method: 'PATCH',
        body: { qty },
      }),
      invalidatesTags: [{ type: 'Cart', id: 'CURRENT' }],
    }),
    removeCartItem: build.mutation<CartDto, string>({
      query: (itemId) => ({ url: `/cart/items/${itemId}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Cart', id: 'CURRENT' }],
    }),
    clearCartRemote: build.mutation<{ ok: true }, void>({
      query: () => ({ url: '/cart/clear', method: 'POST' }),
      invalidatesTags: [{ type: 'Cart', id: 'CURRENT' }],
    }),
    listOrders: build.query<
      PaginatedResult<Order>,
      { page: number; pageSize: number }
    >({
      query: ({ page, pageSize }) => ({
        url: '/orders',
        params: { page, pageSize },
      }),
      transformResponse: (response: unknown, _m, arg) =>
        normalizePaginated<Order>(response, arg),
      providesTags: (result) =>
        result?.items?.length
          ? [
              ...result.items.map((o) => ({ type: 'Order' as const, id: o.id })),
              { type: 'Order', id: 'LIST' },
            ]
          : [{ type: 'Order', id: 'LIST' }],
    }),
    getOrder: build.query<Order, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Order', id }],
    }),
    cancelOrder: build.mutation<Order, string>({
      query: (id) => ({ url: `/orders/${id}/cancel`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Order', id },
        { type: 'Order', id: 'LIST' },
        { type: 'Product', id: 'LIST' },
        { type: 'Cart', id: 'CURRENT' },
      ],
    }),
    createOrder: build.mutation<
      Order,
      {
        items?: Array<{ productId: string; quantity: number }>;
        addressId?: string;
        deliveryPhone?: string;
        deliveryFirstName?: string;
        deliveryLastName?: string;
        addressName?: string;
        roadAddressName?: string | null;
        jibunAddressName?: string | null;
        buildingName?: string | null;
        zoneNo?: string | null;
        detailAddress?: string;
        latitude?: number | null;
        longitude?: number | null;
      }
    >({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: (result) => [
        { type: 'Order', id: 'LIST' },
        { type: 'UserProfile', id: 'ME' },
        { type: 'Product', id: 'LIST' },
        { type: 'Cart', id: 'CURRENT' },
        ...(result?.id ? [{ type: 'Order' as const, id: result.id }] : []),
      ],
    }),
  }),
});

export const {
  useExchangeTelegramMutation,
  useGetProductsQuery,
  useGetSaleProductsQuery,
  useGetBestsellerProductsQuery,
  useGetProductQuery,
  useGetCategoriesQuery,
  useGetMeasurementUnitsQuery,
  useGetBannersQuery,
  useGetProductFeedbackSubmitEligibilityQuery,
  useGetProductFeedbackQuery,
  useSubmitProductFeedbackMutation,
  useGetMeQuery,
  usePatchMeMutation,
  useGetUserAddressesQuery,
  useCreateUserAddressMutation,
  useUpdateUserAddressMutation,
  useDeleteUserAddressMutation,
  useLazySearchAddressesQuery,
  useSearchAddressesQuery,
  useGetWishlistQuery,
  useToggleWishlistMutation,
  useUpdateWishlistPrefsMutation,
  useGetMyNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetCartQuery,
  useUpsertCartItemMutation,
  useUpdateCartItemQtyMutation,
  useRemoveCartItemMutation,
  useClearCartRemoteMutation,
  useListOrdersQuery,
  useGetOrderQuery,
  useCancelOrderMutation,
  useCreateOrderMutation,
} = parfumApi;
