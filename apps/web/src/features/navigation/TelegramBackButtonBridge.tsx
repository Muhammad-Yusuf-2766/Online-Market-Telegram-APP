import {
  hideBackButton,
  isTMA,
  mountBackButton,
  onBackButtonClick,
  showBackButton,
  unmountBackButton,
} from '@telegram-apps/sdk';
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  navigateTmaBack,
  shouldShowTmaBack,
} from '../../shared/lib/tmaBackNavigation';

/**
 * Syncs Telegram header BackButton + Android system back (when supported) with SPA history.
 */
export function TelegramBackButtonBridge() {
  const navigate = useNavigate();
  const location = useLocation();
  const showBack = shouldShowTmaBack(location.pathname);

  const navigateRef = useRef(navigate);
  const pathnameRef = useRef(location.pathname);

  navigateRef.current = navigate;
  pathnameRef.current = location.pathname;

  useEffect(() => {
    if (!isTMA()) return;

    try {
      if (!mountBackButton.isAvailable()) return;
      mountBackButton();
    } catch {
      return;
    }

    function handleBack(): void {
      navigateTmaBack(navigateRef.current, pathnameRef.current);
    }

    let removeListener: VoidFunction | undefined;
    try {
      if (onBackButtonClick.isAvailable()) {
        removeListener = onBackButtonClick(handleBack);
      }
    } catch {
      /* noop */
    }

    return () => {
      try {
        removeListener?.();
      } catch {
        /* noop */
      }
      try {
        if (hideBackButton.isAvailable()) hideBackButton();
      } catch {
        /* noop */
      }
      try {
        unmountBackButton();
      } catch {
        /* noop */
      }
    };
  }, []);

  useEffect(() => {
    if (!isTMA()) return;

    try {
      if (showBack) {
        if (showBackButton.isAvailable()) showBackButton();
      } else if (hideBackButton.isAvailable()) {
        hideBackButton();
      }
    } catch {
      /* noop */
    }
  }, [showBack]);

  return null;
}
