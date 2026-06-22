import { useMemo } from 'react';
import {
  useGetWishlistQuery,
  useToggleWishlistMutation,
} from '../../app/parfumApi';
import { useAppSelector } from '../../app/hooks';
import { trackEvent } from '../../shared/lib/analytics';

export function WishlistHeartButton({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: wishlist } = useGetWishlistQuery(undefined, { skip: !token });
  const [toggle, { isLoading }] = useToggleWishlistMutation();

  const isWishlisted = useMemo(
    () => wishlist?.some((w) => w.productId === productId) ?? false,
    [wishlist, productId],
  );

  if (!token) return null;

  return (
    <button
      type="button"
      className={`wishlist-heart${isWishlisted ? ' wishlist-heart--active' : ''}${className ? ` ${className}` : ''}`}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      disabled={isLoading}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle({ productId })
          .unwrap()
          .then((res) => {
            if (res.added) {
              trackEvent('WISHLIST_ADD', { productId });
            }
          })
          .catch(() => undefined);
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 21s-6.7-4.35-9.33-8.1C.5 9.5 2.5 5.5 6.5 5.5c2.1 0 3.4 1.1 4.5 2.2C12.1 6.6 13.4 5.5 15.5 5.5c4 0 6 4 3.83 7.4C18.7 16.65 12 21 12 21Z"
          stroke="currentColor"
          strokeWidth="1.75"
          fill={isWishlisted ? 'currentColor' : 'none'}
        />
      </svg>
    </button>
  );
}
