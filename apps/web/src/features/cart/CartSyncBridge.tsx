import { useEffect, useRef } from 'react';
import {
  useGetCartQuery,
  useRemoveCartItemMutation,
  useUpsertCartItemMutation,
} from '../../app/parfumApi';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { replaceCart, type CartLine } from './cartSlice';

function toDigest(lines: CartLine[]): string {
  return JSON.stringify(
    [...lines]
      .map((line) => ({
        k: line.lineKey,
        p: line.productId,
        s: line.unitId,
        q: line.quantity,
      }))
      .sort((a, b) => a.k.localeCompare(b.k)),
  );
}

export function CartSyncBridge() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.accessToken);
  const localItems = useAppSelector((s) => s.cart.items);
  const { data: remoteCart } = useGetCartQuery(undefined, { skip: !token });
  const [upsertCartItem] = useUpsertCartItemMutation();
  const [removeCartItem] = useRemoveCartItemMutation();
  const lastSentDigestRef = useRef<string>('');
  const hasHydratedRemoteRef = useRef(false);
  const skipNextPushRef = useRef(false);

  useEffect(() => {
    hasHydratedRemoteRef.current = false;
    skipNextPushRef.current = false;
    lastSentDigestRef.current = '';
  }, [token]);

  useEffect(() => {
    if (!token || !remoteCart || hasHydratedRemoteRef.current) return;
    hasHydratedRemoteRef.current = true;
    if (localItems.length === 0 && remoteCart.items.length > 0) {
      const lines: CartLine[] = remoteCart.items.map((item) => ({
        lineKey: `${item.productId}::default`,
        productId: item.productId,
        unitId: item.product.measurementUnit?.id ?? 'default',
        title: item.product.title,
        unitLabel: item.product.measurementUnit?.symbol ?? null,
        unitPriceKrw: item.product.priceKrw,
        imageUrl: item.product.images[0] ?? null,
        quantity: item.qty,
      }));
      lastSentDigestRef.current = toDigest(lines);
      skipNextPushRef.current = true;
      dispatch(replaceCart(lines));
    }
  }, [dispatch, localItems.length, remoteCart, token]);

  useEffect(() => {
    if (!token || !remoteCart) return;
    if (skipNextPushRef.current) {
      skipNextPushRef.current = false;
      return;
    }
    const digest = toDigest(localItems);
    if (digest === lastSentDigestRef.current) return;
    lastSentDigestRef.current = digest;

    const remoteKeys = new Set(remoteCart.items.map((item) => item.id));
    const push = async () => {
      for (const local of localItems) {
        await upsertCartItem({
          productId: local.productId,
          qty: local.quantity,
        }).unwrap();
      }
      if (localItems.length === 0) {
        for (const remote of remoteCart.items) {
          if (!remoteKeys.has(remote.id)) continue;
          await removeCartItem(remote.id).unwrap();
        }
      }
    };
    void push();
  }, [localItems, removeCartItem, remoteCart, token, upsertCartItem]);

  return null;
}
