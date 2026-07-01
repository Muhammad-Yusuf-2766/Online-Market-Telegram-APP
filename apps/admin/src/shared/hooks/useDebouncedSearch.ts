import { useDebouncedValue } from '@mantine/hooks';

const DEFAULT_SEARCH_DEBOUNCE_MS = 400;

export function useDebouncedSearch(value: string, delay = DEFAULT_SEARCH_DEBOUNCE_MS) {
  const [debouncedValue] = useDebouncedValue(value.trim(), delay);
  return debouncedValue;
}
