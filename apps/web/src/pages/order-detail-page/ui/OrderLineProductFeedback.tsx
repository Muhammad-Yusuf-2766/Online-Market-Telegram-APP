import { Button, Spinner } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  parfumApi,
  useGetProductFeedbackSubmitEligibilityQuery,
  useSubmitProductFeedbackMutation,
} from '../../../app/parfumApi';
import { useAppDispatch } from '../../../app/hooks';

type Props = {
  orderId: string;
  productId: string;
  lineTitle: string;
};

export function OrderLineProductFeedback({ orderId, productId, lineTitle }: Props) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { data: eligibility, isLoading } = useGetProductFeedbackSubmitEligibilityQuery(
    { productId, orderId },
    {
      skip: !productId || !orderId,
      /** Pick up admin approval so the form hides when feedback becomes APPROVED. */
      pollingInterval: 45_000,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    },
  );
  const [submitFeedback, { isLoading: submitting }] = useSubmitProductFeedbackMutation();
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewOk, setReviewOk] = useState(false);

  const fieldId = `order-review-${orderId}-${productId}`;

  if (isLoading) {
    return (
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
        <Spinner size="s" />
      </div>
    );
  }

  if (!eligibility?.canSubmit) {
    switch (eligibility?.reason) {
      case 'ALREADY_PUBLISHED':
        return (
          <p className="page-placeholder order-detail-review-hint" style={{ margin: '8px 0 0' }}>
            {t('product.reviewAlreadyPublished')}
          </p>
        );
      case 'ORDER_NOT_DELIVERED':
        return (
          <p className="page-placeholder order-detail-review-hint" style={{ margin: '8px 0 0' }}>
            {t('orderDetail.reviewAfterDelivery')}
          </p>
        );
      case 'INVALID_ORDER_CONTEXT':
        return (
          <p className="page-placeholder order-detail-review-hint" style={{ margin: '8px 0 0' }}>
            {t('orderDetail.reviewInvalidContext')}
          </p>
        );
      default:
        return (
          <p className="page-placeholder order-detail-review-hint" style={{ margin: '8px 0 0' }}>
            {t('orderDetail.reviewUnavailable')}
          </p>
        );
    }
  }

  return (
    <div className="order-line-feedback">
      <p className="order-line-feedback__title">{t('orderDetail.reviewSection')}</p>
      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t('product.reviewStars')}</p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={
              n <= reviewStars ? 'product-star-btn product-star-btn--on' : 'product-star-btn'
            }
            aria-pressed={n <= reviewStars}
            aria-label={t('product.reviewStarN', { n })}
            onClick={() => setReviewStars(n)}
          >
            ★
          </button>
        ))}
      </div>
      <label className="product-review-label" htmlFor={fieldId}>
        {t('product.reviewComment')}
      </label>
      <textarea
        id={fieldId}
        className="tma-textarea"
        value={reviewComment}
        onChange={(e) => setReviewComment(e.target.value)}
        maxLength={2000}
        rows={3}
        placeholder={t('product.reviewCommentPlaceholder')}
        aria-label={`${lineTitle}: ${t('product.reviewComment')}`}
      />
      {reviewError ? (
        <p className="page-placeholder" style={{ color: 'var(--pb-danger, #b42318)', marginTop: 8 }}>
          {reviewError}
        </p>
      ) : null}
      {reviewOk ? (
        <p className="page-placeholder" style={{ marginTop: 8 }}>
          {t('product.reviewSent')}
        </p>
      ) : null}
      <Button
        mode="filled"
        size="s"
        stretched
        style={{ marginTop: 10 }}
        loading={submitting}
        disabled={submitting}
        onClick={() => {
          setReviewError(null);
          setReviewOk(false);
          void submitFeedback({
            productId,
            orderId,
            stars: reviewStars,
            comment: reviewComment,
          })
            .unwrap()
            .then(() => {
              setReviewOk(true);
            })
            .catch((e: { status?: number; data?: { message?: string } }) => {
              if (e?.status === 409) {
                dispatch(
                  parfumApi.util.invalidateTags([
                    { type: 'ProductFeedback', id: `eligibility-${orderId}-${productId}` },
                  ]),
                );
                return;
              }
              if (e?.status === 403) {
                setReviewError(t('orderDetail.reviewAfterDelivery'));
              } else {
                setReviewError(
                  typeof e?.data?.message === 'string'
                    ? e.data.message
                    : t('product.reviewSubmitError'),
                );
              }
            });
        }}
      >
        {t('product.reviewSubmit')}
      </Button>
    </div>
  );
}
