import {
  init,
  isTMA,
  retrieveRawInitData,
  themeParams,
} from '@telegram-apps/sdk';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useExchangeTelegramMutation } from '../../app/parfumApi';
import { useAppDispatch } from '../../app/hooks';
import { setCredentials } from '../auth/authSlice';
import { TelegramSessionProvider } from './telegramSessionContext';

async function waitForInitDataRaw(maxAttempts = 40): Promise<string | undefined> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const raw = retrieveRawInitData();
      if (raw) return raw;
    } catch {
      /* launch params not readable yet */
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  try {
    return retrieveRawInitData();
  } catch {
    return undefined;
  }
}

function exchangeErrorMessage(err: unknown): string {
  const e = err as { status?: unknown; data?: unknown } | undefined;
  if (e && typeof e === 'object' && 'status' in e) {
    if (e.status === 'FETCH_ERROR' || e.status === 'PARSING_ERROR') {
      return 'Could not reach the API. Check that it is running and reachable from this device.';
    }
    if (
      e.status === 401 &&
      e.data &&
      typeof e.data === 'object' &&
      'message' in e.data
    ) {
      const m = (e.data as { message: unknown }).message;
      if (typeof m === 'string') return m;
    }
    if (typeof e.data === 'object' && e.data && 'message' in e.data) {
      const m = (e.data as { message: unknown }).message;
      if (typeof m === 'string') return m;
    }
  }
  return 'Could not sign in with Telegram. Check TELEGRAM_BOT_TOKEN on the API and that the Web App URL matches your tunnel.';
}

/**
 * Initializes the Telegram Mini App SDK, then exchanges Web App initData for an API JWT
 * (or applies dev token in browser). Exposes session state so UI can wait instead of showing
 * misleading "open in Telegram" copy while auth is still in progress.
 */
export function UserSessionBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const [exchangeTelegram] = useExchangeTelegramMutation();
  const [isTelegramAuthPending, setTelegramAuthPending] = useState(() => isTMA());
  const [telegramSignInError, setTelegramSignInError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    const devJwt = import.meta.env.VITE_DEV_JWT as string | undefined;
    if (!isTMA() && import.meta.env.VITE_DEV && devJwt?.trim()) {
      dispatch(
        setCredentials({
          accessToken: devJwt.trim(),
          expiresAtMs: Date.now() + 86400_000 * 7,
          user: null,
        }),
      );
      setTelegramAuthPending(false);
      return;
    }

    if (!isTMA()) {
      setTelegramAuthPending(false);
      return;
    }

    const cleanupInit = init();
    try {
      if (themeParams.mountSync.isAvailable()) {
        themeParams.mountSync();
      }
      if (themeParams.bindCssVars.isAvailable()) {
        themeParams.bindCssVars();
      }
    } catch {
      /* Unsupported bridge */
    }

    async function run() {
      setTelegramSignInError(null);
      try {
        const initDataRaw = await waitForInitDataRaw();
        if (cancelled) return;
        if (!initDataRaw) {
          setTelegramSignInError(
            'Telegram did not provide init data. Open the app from your bot (not only the tunnel URL in a browser), and avoid opening a deep link to a route before the first load finishes.',
          );
          return;
        }
        const res = await exchangeTelegram({ initDataRaw }).unwrap();
        if (cancelled) return;
        dispatch(
          setCredentials({
            accessToken: res.accessToken,
            expiresIn: res.expiresIn,
            user: res.user,
          }),
        );
      } catch (err) {
        if (!cancelled) {
          setTelegramSignInError(exchangeErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setTelegramAuthPending(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
      cleanupInit();
    };
  }, [dispatch, exchangeTelegram]);

  const sessionValue = useMemo(
    () => ({ isTelegramAuthPending, telegramSignInError }),
    [isTelegramAuthPending, telegramSignInError],
  );

  return (
    <TelegramSessionProvider value={sessionValue}>
      {children}
    </TelegramSessionProvider>
  );
}
