/**
 * Client-Side In-Memory & Session Storage Response Cache
 * Avoids redundant network calls when browsing products, categories, or navigating between pages.
 */

interface CacheItem<T> {
  data: T;
  expiry: number;
}

class ApiCache {
  private memory = new Map<string, CacheItem<any>>();

  /**
   * Generates a stable cache key from endpoint and parameters.
   */
  public generateKey(endpoint: string, params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) {
      return endpoint;
    }
    const sorted = Object.keys(params)
      .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
      .sort()
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(params[k]))}`)
      .join('&');
    return `${endpoint}?${sorted}`;
  }

  /**
   * Retrieves data from memory cache or session storage.
   */
  public get<T>(key: string): T | null {
    // 1. Check in-memory cache first (fastest)
    const memItem = this.memory.get(key);
    if (memItem) {
      if (Date.now() < memItem.expiry) {
        return memItem.data as T;
      }
      this.memory.delete(key);
    }

    // 2. Check sessionStorage fallback
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const raw = window.sessionStorage.getItem(`cdt_cache_${key}`);
        if (raw) {
          const parsed: CacheItem<T> = JSON.parse(raw);
          if (Date.now() < parsed.expiry) {
            // Restore to memory for subsequent synchronous access
            this.memory.set(key, parsed);
            return parsed.data;
          }
          window.sessionStorage.removeItem(`cdt_cache_${key}`);
        }
      } catch {
        // Storage access restricted or invalid JSON
      }
    }

    return null;
  }

  /**
   * Saves data into memory cache and sessionStorage with a TTL in seconds.
   */
  public set<T>(key: string, data: T, ttlSeconds: number = 180): void {
    const expiry = Date.now() + ttlSeconds * 1000;
    const item: CacheItem<T> = { data, expiry };

    // Set memory
    this.memory.set(key, item);

    // Set sessionStorage (guarded against quota errors)
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(`cdt_cache_${key}`, JSON.stringify(item));
      } catch {
        // Quota exceeded or disabled, memory cache will suffice
      }
    }
  }

  /**
   * Invalidate a single key or all keys matching a prefix.
   */
  public invalidate(prefixOrPattern?: string): void {
    if (!prefixOrPattern) {
      this.memory.clear();
      if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
          const keys = Object.keys(window.sessionStorage);
          for (const k of keys) {
            if (k.startsWith('cdt_cache_')) {
              window.sessionStorage.removeItem(k);
            }
          }
        } catch {
          // Ignore
        }
      }
      return;
    }

    // Invalidate matching keys
    for (const key of this.memory.keys()) {
      if (key.includes(prefixOrPattern)) {
        this.memory.delete(key);
      }
    }

    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const keys = Object.keys(window.sessionStorage);
        for (const k of keys) {
          if (k.startsWith('cdt_cache_') && k.includes(prefixOrPattern)) {
            window.sessionStorage.removeItem(k);
          }
        }
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Clears the entire cache.
   */
  public clear(): void {
    this.invalidate();
  }
}

export const clientCache = new ApiCache();
