import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { trackEvent } from '../../shared/lib/analytics';

const STORAGE_KEY = 'ansor_market_cart';
const DEFAULT_CART_UNIT_ID = 'default';

function cartLineKey(productId: string): string {
  return `${productId}::${DEFAULT_CART_UNIT_ID}`;
}

export type CartLine = {
  lineKey: string;
  productId: string;
  unitId: string;
  title: string;
  unitLabel: string | null;
  unitPriceKrw: number;
  imageUrl: string | null;
  quantity: number;
};

export type CartState = {
  items: CartLine[];
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
  let unitPriceKrw: number;
  if (typeof o.unitPriceKrw === 'number') {
    unitPriceKrw = o.unitPriceKrw;
  } else if (typeof (o as { unitPriceCents?: number }).unitPriceCents === 'number') {
    unitPriceKrw = Math.round((o as { unitPriceCents: number }).unitPriceCents / 100);
  } else {
    return null;
  }
  const unitId =
    typeof o.unitId === 'string' && o.unitId.length > 0
      ? o.unitId
      : DEFAULT_CART_UNIT_ID;
  const lineKey =
    typeof o.lineKey === 'string' && o.lineKey.length > 0
      ? o.lineKey
      : cartLineKey(o.productId);
  const unitLabel =
    o.unitLabel === null || o.unitLabel === undefined
      ? null
      : typeof o.unitLabel === 'string'
        ? o.unitLabel
        : null;
  const imageUrl =
    o.imageUrl === null || typeof o.imageUrl === 'string'
      ? (o.imageUrl as string | null)
      : null;
  return {
    lineKey,
    productId: o.productId,
    unitId,
    title: o.title,
    unitLabel,
    unitPriceKrw,
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

const initialState: CartState = { items: loadCart() };

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
        unitId?: string;
        title: string;
        unitLabel: string | null;
        unitPriceKrw: number;
        imageUrl: string | null;
        quantity?: number;
      }>,
    ) {
      const qty = action.payload.quantity ?? 1;
      const unitId = action.payload.unitId ?? DEFAULT_CART_UNIT_ID;
      const lineKey = cartLineKey(action.payload.productId);
      const existing = state.items.find((i) => i.lineKey === lineKey);
      if (existing) {
        existing.quantity += qty;
        existing.title = action.payload.title;
        existing.unitLabel = action.payload.unitLabel;
        existing.unitPriceKrw = action.payload.unitPriceKrw;
        existing.imageUrl = action.payload.imageUrl;
      } else {
        state.items.push({
          lineKey,
          productId: action.payload.productId,
          unitId,
          title: action.payload.title,
          unitLabel: action.payload.unitLabel,
          unitPriceKrw: action.payload.unitPriceKrw,
          imageUrl: action.payload.imageUrl,
          quantity: qty,
        });
      }
      trackEvent('ADD_TO_CART', {
        productId: action.payload.productId,
        properties: { quantity: qty },
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
        });
      }
      state.items = state.items.filter((i) => i.lineKey !== action.payload);
      saveCart(state.items);
    },
    clearCart(state) {
      state.items = [];
      saveCart(state.items);
    },
  },
});

export const {
  replaceCart,
  addOrMergeLine,
  setLineQuantity,
  removeLine,
  clearCart,
} = cartSlice.actions;
