import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  cartLineKey,
  DEFAULT_CART_SIZE_ID,
} from '../../shared/lib/productSizes';
import { trackEvent } from '../../shared/lib/analytics';

const STORAGE_KEY = 'pb_cart';

export type CartLine = {
  lineKey: string;
  productId: string;
  sizeId: string;
  title: string;
  sizeLabel: string | null;
  unitPriceUzs: number;
  imageUrl: string | null;
  quantity: number;
};

export type AppliedPromo = {
  code: string;
  discountUzs: number;
};

export type CartState = {
  items: CartLine[];
  appliedPromo: AppliedPromo | null;
};

function parseCartLine(raw: unknown): CartLine | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (
    typeof o.productId !== 'string' ||
    typeof o.quantity !== 'number' ||
    typeof o.title !== 'string'
  ) {
    return null;
  }
  let unitPriceUzs: number;
  if (typeof o.unitPriceUzs === 'number') {
    unitPriceUzs = o.unitPriceUzs;
  } else if (typeof (o as { unitPriceCents?: number }).unitPriceCents === 'number') {
    unitPriceUzs = Math.round((o as { unitPriceCents: number }).unitPriceCents / 100);
  } else {
    return null;
  }
  const sizeId =
    typeof o.sizeId === 'string' && o.sizeId.length > 0
      ? o.sizeId
      : DEFAULT_CART_SIZE_ID;
  const lineKey =
    typeof o.lineKey === 'string' && o.lineKey.length > 0
      ? o.lineKey
      : cartLineKey(o.productId, sizeId);
  const sizeLabel =
    o.sizeLabel === null || o.sizeLabel === undefined
      ? null
      : typeof o.sizeLabel === 'string'
        ? o.sizeLabel
        : null;
  const imageUrl =
    o.imageUrl === null || typeof o.imageUrl === 'string'
      ? (o.imageUrl as string | null)
      : null;
  return {
    lineKey,
    productId: o.productId,
    sizeId,
    title: o.title,
    sizeLabel,
    unitPriceUzs,
    imageUrl,
    quantity: o.quantity,
  };
}

function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(parseCartLine)
      .filter((line): line is CartLine => line !== null);
  } catch {
    return [];
  }
}

function saveCart(items: CartLine[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const initialState: CartState = { items: loadCart(), appliedPromo: null };

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    replaceCart(state, action: PayloadAction<CartLine[]>) {
      state.items = action.payload;
      saveCart(state.items);
    },
    addOrMergeLine(
      state,
      action: PayloadAction<{
        productId: string;
        sizeId: string;
        title: string;
        sizeLabel: string | null;
        unitPriceUzs: number;
        imageUrl: string | null;
        quantity?: number;
      }>,
    ) {
      const qty = action.payload.quantity ?? 1;
      const lineKey = cartLineKey(
        action.payload.productId,
        action.payload.sizeId,
      );
      const existing = state.items.find((i) => i.lineKey === lineKey);
      if (existing) {
        existing.quantity += qty;
        existing.title = action.payload.title;
        existing.sizeLabel = action.payload.sizeLabel;
        existing.unitPriceUzs = action.payload.unitPriceUzs;
        existing.imageUrl = action.payload.imageUrl;
      } else {
        state.items.push({
          lineKey,
          productId: action.payload.productId,
          sizeId: action.payload.sizeId,
          title: action.payload.title,
          sizeLabel: action.payload.sizeLabel,
          unitPriceUzs: action.payload.unitPriceUzs,
          imageUrl: action.payload.imageUrl,
          quantity: qty,
        });
      }
      trackEvent('ADD_TO_CART', {
        productId: action.payload.productId,
        properties: { sizeId: action.payload.sizeId, quantity: qty },
      });
      saveCart(state.items);
    },
    setLineQuantity(
      state,
      action: PayloadAction<{ lineKey: string; quantity: number }>,
    ) {
      const line = state.items.find(
        (i) => i.lineKey === action.payload.lineKey,
      );
      if (!line) return;
      if (action.payload.quantity < 1) {
        trackEvent('REMOVE_FROM_CART', {
          productId: line.productId,
          properties: { sizeId: line.sizeId },
        });
        state.items = state.items.filter(
          (i) => i.lineKey !== action.payload.lineKey,
        );
      } else {
        line.quantity = action.payload.quantity;
      }
      saveCart(state.items);
    },
    removeLine(state, action: PayloadAction<string>) {
      const current = state.items.find((i) => i.lineKey === action.payload);
      if (current) {
        trackEvent('REMOVE_FROM_CART', {
          productId: current.productId,
          properties: { sizeId: current.sizeId },
        });
      }
      state.items = state.items.filter((i) => i.lineKey !== action.payload);
      saveCart(state.items);
    },
    clearCart(state) {
      state.items = [];
      state.appliedPromo = null;
      saveCart(state.items);
    },
    setAppliedPromo(state, action: PayloadAction<AppliedPromo | null>) {
      state.appliedPromo = action.payload;
    },
  },
});

export const {
  replaceCart,
  addOrMergeLine,
  setLineQuantity,
  removeLine,
  clearCart,
  setAppliedPromo,
} = cartSlice.actions;
