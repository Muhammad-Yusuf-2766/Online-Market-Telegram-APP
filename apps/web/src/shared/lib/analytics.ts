import { getParfumApiBaseUrl } from '../../app/parfumApi';

export type AnalyticsEventType =
  | 'APP_OPEN'
  | 'PRODUCT_VIEW'
  | 'SEARCH'
  | 'ADD_TO_CART'
  | 'REMOVE_FROM_CART'
  | 'CHECKOUT_START'
  | 'CHECKOUT_SUBMIT'
  | 'ORDER_CREATED'
  | 'WISHLIST_ADD'
  | 'COIN_TOGGLE'
  | 'CAMPAIGN_LANDED';

type AnalyticsEvent = {
  eventType: AnalyticsEventType;
  sessionId: string;
  productId?: string;
  orderId?: string;
  searchQuery?: string;
  properties?: Record<string, unknown>;
  tmaPlatform?: string;
};

const SESSION_KEY = 'pb_analytics_sid';
const AUTH_KEY = 'pb_tma_auth';

function ensureSessionId(): string {
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const next = crypto.randomUUID();
  localStorage.setItem(SESSION_KEY, next);
  return next;
}

function readAccessToken(): string | null {
  try {
    const raw = sessionStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { accessToken?: unknown };
    return typeof parsed.accessToken === 'string' ? parsed.accessToken : null;
  } catch {
    return null;
  }
}

let queue: AnalyticsEvent[] = [];
let flushTimer: number | null = null;

async function flush(): Promise<void> {
  if (queue.length === 0) return;
  const payload = { events: queue.slice(0, 50) };
  queue = queue.slice(50);
  const token = readAccessToken();
  try {
    await fetch(`${getParfumApiBaseUrl()}/analytics/${token ? 'events' : 'events/anonymous'}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Ignore analytics delivery errors.
  }
  if (queue.length > 0) {
    void flush();
  }
}

function scheduleFlush() {
  if (flushTimer != null) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    void flush();
  }, 5000);
}

export function trackEvent(
  eventType: AnalyticsEventType,
  payload: Omit<AnalyticsEvent, 'eventType' | 'sessionId'> = {},
): void {
  queue.push({
    eventType,
    sessionId: ensureSessionId(),
    ...payload,
  });
  if (queue.length >= 20) {
    if (flushTimer != null) {
      window.clearTimeout(flushTimer);
      flushTimer = null;
    }
    void flush();
    return;
  }
  scheduleFlush();
}

