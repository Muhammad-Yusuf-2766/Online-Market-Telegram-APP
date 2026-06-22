import { createContext, useContext, type ReactNode } from 'react';

export type TelegramSessionContextValue = {
  /** True while Telegram initData may still be exchanged for a JWT */
  isTelegramAuthPending: boolean;
  /** Populated when running in Telegram, exchange finished, and there is still no session */
  telegramSignInError: string | null;
};

const TelegramSessionContext = createContext<TelegramSessionContextValue>({
  isTelegramAuthPending: false,
  telegramSignInError: null,
});

export function useTelegramSession(): TelegramSessionContextValue {
  return useContext(TelegramSessionContext);
}

export function TelegramSessionProvider({
  value,
  children,
}: {
  value: TelegramSessionContextValue;
  children: ReactNode;
}) {
  return (
    <TelegramSessionContext.Provider value={value}>
      {children}
    </TelegramSessionContext.Provider>
  );
}
