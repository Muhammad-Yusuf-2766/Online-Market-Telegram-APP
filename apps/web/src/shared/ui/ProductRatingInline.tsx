import { useTranslation } from 'react-i18next';

type Props = {
  ratingAvg: number | null;
  ratingCount: number;
  className?: string;
};

export function ProductRatingInline({ ratingAvg, ratingCount, className }: Props) {
  const { t } = useTranslation();
  if (!ratingCount || ratingAvg == null) {
    return (
      <span className={`product-rating-inline product-rating-inline--muted ${className ?? ''}`}>
        {t('product.ratingNone')}
      </span>
    );
  }
  const rounded = Math.round(ratingAvg * 10) / 10;
  return (
    <span className={`product-rating-inline ${className ?? ''}`} title={t('product.ratingTitle', { avg: rounded, count: ratingCount })}>
      <span className="product-rating-inline__star" aria-hidden>
        ★
      </span>
      <span className="product-rating-inline__avg">{rounded}</span>
      <span className="product-rating-inline__count">
        ({t('product.ratingCountShort', { count: ratingCount })})
      </span>
    </span>
  );
}
