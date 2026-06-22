import { useNavigate } from 'react-router-dom';
import { openLink } from '@telegram-apps/sdk';
import type { Banner } from '../../../app/parfumApi';
import './banner-carousel.css';

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const navigate = useNavigate();
  if (!banners.length) return null;

  return (
    <div className="banner-carousel" aria-label="Promotions">
      <div className="banner-carousel__track">
        {banners.map((b) => (
          <button
            key={b.id}
            type="button"
            className="banner-carousel__slide"
            onClick={() => {
              if (!b.linkUrl) return;
              if (b.linkUrl.startsWith('/')) {
                navigate(b.linkUrl);
                return;
              }
              if (openLink.isAvailable()) {
                openLink(b.linkUrl);
              } else {
                window.open(b.linkUrl, '_blank', 'noopener,noreferrer');
              }
            }}
          >
            <img src={b.imageUrl} alt={b.title ?? ''} loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
}
