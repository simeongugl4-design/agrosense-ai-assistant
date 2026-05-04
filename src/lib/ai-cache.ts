// Lightweight offline-first cache for AI responses.
// Stores serializable JSON in localStorage, keyed by (namespace, params), with TTL.
// Falls back to last-known-good value when network/AI fails.

const PREFIX = "agrosense_ai_cache_v1:";
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

type Entry<T> = { value: T; savedAt: number; ttl: number };

function keyFor(namespace: string, params: unknown): string {
  let raw: string;
  try {
    raw = JSON.stringify(params ?? {});
  } catch {
    raw = String(params);
  }
  return `${PREFIX}${namespace}:${raw}`;
}

export function readCache<T>(namespace: string, params: unknown): T | null {
  try {
    const raw = localStorage.getItem(keyFor(namespace, params));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Entry<T>;
    if (Date.now() - parsed.savedAt > parsed.ttl) {
      return parsed.value; // still return as stale fallback; caller decides
    }
    return parsed.value;
  } catch {
    return null;
  }
}

export function isFresh(namespace: string, params: unknown): boolean {
  try {
    const raw = localStorage.getItem(keyFor(namespace, params));
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Entry<unknown>;
    return Date.now() - parsed.savedAt <= parsed.ttl;
  } catch {
    return false;
  }
}

export function writeCache<T>(
  namespace: string,
  params: unknown,
  value: T,
  ttl: number = DEFAULT_TTL_MS,
): void {
  try {
    const entry: Entry<T> = { value, savedAt: Date.now(), ttl };
    localStorage.setItem(keyFor(namespace, params), JSON.stringify(entry));
  } catch {
    // quota or serialization error — ignore
  }
}

/**
 * Wrap a fetcher with caching. If `force` is false and a fresh cached value
 * exists, returns it immediately. Otherwise calls `fetcher`. On failure,
 * falls back to any cached value (even stale) before throwing.
 */
export async function cachedFetch<T>(
  namespace: string,
  params: unknown,
  fetcher: () => Promise<T>,
  options: { ttl?: number; force?: boolean } = {},
): Promise<{ value: T; fromCache: boolean; stale: boolean }> {
  const { ttl = DEFAULT_TTL_MS, force = false } = options;
  if (!force && isFresh(namespace, params)) {
    const cached = readCache<T>(namespace, params);
    if (cached !== null) return { value: cached, fromCache: true, stale: false };
  }
  try {
    const value = await fetcher();
    writeCache(namespace, params, value, ttl);
    return { value, fromCache: false, stale: false };
  } catch (err) {
    const fallback = readCache<T>(namespace, params);
    if (fallback !== null) {
      return { value: fallback, fromCache: true, stale: true };
    }
    throw err;
  }
}

export function clearCacheNamespace(namespace: string): void {
  try {
    const prefix = `${PREFIX}${namespace}:`;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}
