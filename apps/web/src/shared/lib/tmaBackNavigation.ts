import type { NavigateFunction } from 'react-router-dom';

/** Routes where we show in-app / Telegram BackButton and intercept system back when possible. */
export function shouldShowTmaBack(pathname: string): boolean {
  if (pathname.startsWith('/product/')) return true;
  if (pathname === '/checkout') return true;
  if (pathname === '/coins') return true;
  if (pathname === '/search') return true;
  if (pathname.startsWith('/orders/')) {
    const rest = pathname.slice('/orders/'.length).replace(/\/$/, '');
    return rest.length > 0;
  }
  return false;
}

export function navigateTmaBack(navigate: NavigateFunction, pathname: string): void {
  if (pathname.startsWith('/orders/')) {
    const rest = pathname.slice('/orders/'.length).replace(/\/$/, '');
    if (rest.length > 0) {
      navigate('/orders');
      return;
    }
  }
  if (pathname === '/checkout') {
    navigate('/cart');
    return;
  }
  if (pathname === '/coins') {
    navigate('/');
    return;
  }
  if (pathname === '/search') {
    navigate(-1);
    return;
  }
  if (pathname.startsWith('/product/')) {
    navigate(-1);
    return;
  }
}
