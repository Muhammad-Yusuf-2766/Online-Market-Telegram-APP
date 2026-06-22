import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
} from '@reduxjs/toolkit/query/react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { logout } from '../features/auth/authSlice';
import type { TelegramAuthUser } from '../features/auth/authSlice';
import { normalizePaginated } from './paginationNormalize';

/**
 * Resolve the Parfumbox API base URL.
 *
 * Priority:
 *  1. `VITE_API_BASE_URL` (set explicitly in `.env` or as a Docker build ARG on Railway).
 *  2. In dev: same-origin `/_parfumbox-api` (proxied by Vite to localhost:3000) so Telegram /
 *     ngrok tunnels reach the API through a single HTTPS origin.
 *  3. In prod with no env: same-origin (empty string) — relies on the web host proxying `/`
 *     paths to the API. We log a warning because cross-origin deployments (Railway) need
 *     `VITE_API_BASE_URL` baked into the build.
 */
export function getParfumApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (import.meta.env.DEV) return '/_parfumbox-api';
  if (typeof window !== 'undefined') {
    console.warn(
      '[parfumApi] VITE_API_BASE_URL was not set at build time. Falling back to same-origin requests.',
    );
  }
  return '';
}

const baseUrl = getParfumApiBaseUrl();

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { getState }) => {
    const token = (
      getState() as { auth: { accessToken: string | null } }
    ).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
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

export type ProductSizeOption = {
  id: string;
  presetId: string;
  label: string;
  grams: number;
  priceUzs: number;
};

export type Product = {
  id: string;
  title: string;
  description: string;
  priceUzs: number;
  oldPriceUzs?: number | null;
  discountPercent?: number | null;
  categoryId?: string | null;
  brandId?: string | null;
  familyId?: string | null;
  gender?: 'MEN' | 'WOMEN' | 'UNISEX';
  sizes: ProductSizeOption[] | null;
  images: string[];
  stock: number | null;
  /** Total perfume volume in warehouse; sellable units per size = floor(stockGrams / size grams). */
  stockGrams?: number | null;
  maxUnitsBySizeId?: Record<string, number> | null;
  ratingAvg: number | null;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
};

/** Matches `ProductListSort` on the API (`GET /products?sort=…`). */
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
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

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

export type Order = {
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
  referralCode: string;
  coinBalance: number;
  createdAt: string;
  updatedAt: string;
};

export type RewardSettingsPublic = {
  referralCoins: number;
  profileBirthdayCoins: number;
  profileGenderCoins: number;
  profileLastNameCoins: number;
  profileFullCoins: number;
};

export type ReferralTreeNode = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  referralCode: string;
  createdAt: string;
  children: ReferralTreeNode[];
};

export type CoinInboxEntry = {
  id: string;
  kind: string;
  delta: number;
  metadata: unknown;
  createdAt: string;
};

export type Category = { id: string; slug: string; name: string };
export type Brand = { id: string; slug: string; name: string };
export type FragranceFamily = { id: string; slug: string; name: string };
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
  sizeSlug: string | null;
  qty: number;
  updatedAt: string;
  product: {
    id: string;
    title: string;
    priceUzs: number;
    stock: number | null;
    images: string[];
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
    'CoinInbox',
    'RewardSettings',
    'Wishlist',
    'Notification',
    'Banner',
  ],
  /** Apply tag invalidations as soon as mutations settle so balance/UI stay in sync. */
  invalidationBehavior: 'immediately',
  endpoints: (build) => ({
    exchangeTelegram: build.mutation<
      TelegramAuthResponse,
      { initDataRaw: string }
    >({
      query: (body) => ({
        url: '/auth/telegram',
        method: 'POST',
        body,
      }),
    }),
    getProducts: build.query<
      PaginatedResult<Product>,
      {
        page: number;
        pageSize: number;
        q?: string;
        sort?: ProductListSort;
        categorySlug?: string;
        brandSlug?: string;
        gender?: 'MEN' | 'WOMEN' | 'UNISEX';
        familySlug?: string;
        priceMin?: number;
        priceMax?: number;
        inStockOnly?: boolean;
        bestseller?: boolean;
        newArrival?: boolean;
        discounted?: boolean;
      }
    >({
      query: ({
        page,
        pageSize,
        q,
        sort,
        categorySlug,
        brandSlug,
        gender,
        familySlug,
        priceMin,
        priceMax,
        inStockOnly,
        bestseller,
        newArrival,
        discounted,
      }) => ({
        url: '/products',
        params: {
          page,
          pageSize,
          ...(q?.trim() ? { q: q.trim() } : {}),
          ...(sort && sort !== 'newest' ? { sort } : {}),
          ...(categorySlug ? { categorySlug } : {}),
          ...(brandSlug ? { brandSlug } : {}),
          ...(gender ? { gender } : {}),
          ...(familySlug ? { familySlug } : {}),
          ...(priceMin != null ? { priceMin } : {}),
          ...(priceMax != null ? { priceMax } : {}),
          ...(inStockOnly ? { inStockOnly: true } : {}),
          ...(bestseller ? { bestseller: true } : {}),
          ...(newArrival ? { newArrival: true } : {}),
          ...(discounted ? { discounted: true } : {}),
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
    getProduct: build.query<Product, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Product', id }],
    }),
    getHighlights: build.query<{ bestseller: Product[]; newArrivals: Product[]; discounted: Product[] }, void>({
      query: () => '/products/highlights',
    }),
    getSimilarProducts: build.query<Product[], string>({
      query: (id) => `/products/${id}/similar`,
    }),
    getFrequentlyBoughtTogether: build.query<Product[], string>({
      query: (id) => `/products/${id}/frequently-bought-together`,
    }),
    getCategories: build.query<Category[], void>({ query: () => '/categories' }),
    getBrands: build.query<Brand[], void>({ query: () => '/brands' }),
    getFragranceFamilies: build.query<FragranceFamily[], void>({
      query: () => '/fragrance-families',
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
        normalizePaginated<ProductFeedbackPublic>(response, {
          page: arg.page,
          pageSize: arg.pageSize,
        }),
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
        body: {
          orderId,
          stars,
          comment: comment?.trim() || undefined,
        },
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
      query: (body) => ({
        url: '/users/me',
        method: 'PATCH',
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            parfumApi.util.updateQueryData('getMe', undefined, () => data),
          );
        } catch {
          /* mutation failed — keep prior cache */
        }
      },
    }),
    getRewardSettings: build.query<RewardSettingsPublic, void>({
      query: () => '/settings/rewards',
      providesTags: [{ type: 'RewardSettings', id: 'PUBLIC' }],
    }),
    getReferralTree: build.query<ReferralTreeNode, { maxDepth?: number }>({
      query: ({ maxDepth = 5 }) => ({
        url: '/users/me/referral-tree',
        params: { maxDepth },
      }),
    }),
    getCoinInbox: build.query<CoinInboxEntry[], void>({
      query: () => '/users/me/coin-inbox',
      providesTags: [{ type: 'CoinInbox', id: 'LIST' }],
    }),
    getRecentlyViewed: build.query<Product[], void>({
      query: () => '/users/me/recently-viewed',
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
          ...normalizePaginated<UserNotification>(r, {
            page: arg.page,
            pageSize: arg.pageSize,
          }),
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
      query: () => ({
        url: '/users/me/notifications/read-all',
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
    }),
    validatePromoCode: build.mutation<
      { promoCodeId: string; discountUzs: number },
      { code: string; subtotalUzs: number }
    >({
      query: (body) => ({ url: '/promo-codes/validate', method: 'POST', body }),
    }),
    getCart: build.query<CartDto, void>({
      query: () => '/cart',
      providesTags: [{ type: 'Order', id: 'CART' }],
    }),
    upsertCartItem: build.mutation<CartDto, { productId: string; sizeSlug?: string; qty: number }>({
      query: (body) => ({ url: '/cart/items', method: 'POST', body }),
      invalidatesTags: [{ type: 'Order', id: 'CART' }],
    }),
    updateCartItemQty: build.mutation<CartDto, { itemId: string; qty: number }>({
      query: ({ itemId, qty }) => ({
        url: `/cart/items/${itemId}`,
        method: 'PATCH',
        body: { qty },
      }),
      invalidatesTags: [{ type: 'Order', id: 'CART' }],
    }),
    removeCartItem: build.mutation<CartDto, string>({
      query: (itemId) => ({ url: `/cart/items/${itemId}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Order', id: 'CART' }],
    }),
    clearCartRemote: build.mutation<{ ok: true }, void>({
      query: () => ({ url: '/cart/clear', method: 'POST' }),
      invalidatesTags: [{ type: 'Order', id: 'CART' }],
    }),
    postCoinInboxAck: build.mutation<{ ok: true }, void>({
      query: () => ({
        url: '/users/me/coin-inbox/ack',
        method: 'POST',
      }),
      invalidatesTags: [
        { type: 'CoinInbox', id: 'LIST' },
        { type: 'UserProfile', id: 'ME' },
      ],
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
        normalizePaginated<Order>(response, {
          page: arg.page,
          pageSize: arg.pageSize,
        }),
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
        { type: 'UserProfile', id: 'ME' },
        { type: 'Product', id: 'LIST' },
      ],
    }),
    createOrder: build.mutation<
      Order,
      {
        items: Array<{
          productId: string;
          quantity: number;
          sizeId?: string;
        }>;
        deliveryPhone?: string;
        deliveryFirstName?: string;
        deliveryLastName?: string;
        birthDate?: string;
        deliveryLatitude?: number;
        deliveryLongitude?: number;
        coinsToSpendUzs?: number;
        promoCode?: string;
      }
    >({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: (result, _err, arg) => {
        const tags: Array<
          | { type: 'Order'; id: string }
          | { type: 'UserProfile'; id: string }
          | { type: 'Product'; id: string }
          | { type: 'ProductFeedback'; id: string }
        > = [
          { type: 'Order', id: 'LIST' },
          { type: 'UserProfile', id: 'ME' },
          { type: 'Product', id: 'LIST' },
        ];
        if (result?.id) {
          for (const i of arg.items) {
            tags.push({
              type: 'ProductFeedback',
              id: `eligibility-${result.id}-${i.productId}`,
            });
          }
        }
        return tags;
      },
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        const spend = arg.coinsToSpendUzs ?? 0;
        if (spend <= 0) return;
        const patch = dispatch(
          parfumApi.util.updateQueryData('getMe', undefined, (draft) => {
            draft.coinBalance = Math.max(0, draft.coinBalance - spend);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
  }),
});

export const {
  useExchangeTelegramMutation,
  useGetProductsQuery,
  useGetProductQuery,
  useGetHighlightsQuery,
  useGetSimilarProductsQuery,
  useGetFrequentlyBoughtTogetherQuery,
  useGetCategoriesQuery,
  useGetBrandsQuery,
  useGetFragranceFamiliesQuery,
  useGetBannersQuery,
  useGetProductFeedbackSubmitEligibilityQuery,
  useGetProductFeedbackQuery,
  useSubmitProductFeedbackMutation,
  useGetMeQuery,
  usePatchMeMutation,
  useGetRewardSettingsQuery,
  useGetReferralTreeQuery,
  useGetCoinInboxQuery,
  useGetRecentlyViewedQuery,
  useGetWishlistQuery,
  useToggleWishlistMutation,
  useUpdateWishlistPrefsMutation,
  useGetMyNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useValidatePromoCodeMutation,
  useGetCartQuery,
  useUpsertCartItemMutation,
  useUpdateCartItemQtyMutation,
  useRemoveCartItemMutation,
  useClearCartRemoteMutation,
  usePostCoinInboxAckMutation,
  useListOrdersQuery,
  useGetOrderQuery,
  useCancelOrderMutation,
  useCreateOrderMutation,
} = parfumApi;
