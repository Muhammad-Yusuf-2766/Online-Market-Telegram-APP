import { useState } from 'react';
import type { Banner } from '../../../app/parfumApi';
import './banner-carousel.css';

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [preview, setPreview] = useState<Banner | null>(null);
  if (!banners.length) return null;

  return (
    <>
      <div className="banner-carousel" aria-label="Promotions">
        <div className="banner-carousel__track">
          {banners.map((b) =>
            b.imageUrl ? (
              <button
                key={b.id}
                type="button"
                className="banner-carousel__slide"
                onClick={() => setPreview(b)}
              >
                <img src={b.imageUrl} alt={b.title ?? ''} loading="lazy" />
              </button>
            ) : null,
          )}
        </div>
      </div>
      {preview ? (
        <div className="banner-preview" role="dialog" aria-modal="true">
          <button
            type="button"
            className="banner-preview__backdrop"
            aria-label="Yopish"
            onClick={() => setPreview(null)}
          />
          <div className="banner-preview__sheet">
            <button
              type="button"
              className="banner-preview__close"
              aria-label="Yopish"
              onClick={() => setPreview(null)}
            >
              X
            </button>
            <img src={preview.imageUrl} alt={preview.title ?? ''} />
          </div>
        </div>
      ) : null}
    </>
  );
}
