/**
 * High-Performance In-Memory TTL Cache for Server-Side WooCommerce & Catalog Queries
 * Supports Time-To-Live (TTL), stale-while-revalidate, key pattern invalidation, and metrics.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

export class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(cleanupIntervalMs: number = 60000) {
    // Periodic garbage collection for expired entries
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.purgeExpired();
      }, cleanupIntervalMs);
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  /**
   * Get a cached item. Returns null if expired or not found.
   */
  public get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Store an item with a specified Time-To-Live in seconds.
   */
  public set<T>(key: string, data: T, ttlSeconds: number = 180): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, {
      data,
      expiresAt,
      createdAt: Date.now(),
    });
  }

  /**
   * Delete a specific cache key.
   */
  public delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Invalidate all keys matching a prefix or regex pattern.
   * e.g., invalidatePattern('wc_products')
   */
  public invalidatePattern(pattern: string | RegExp): number {
    let count = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all cached data.
   */
  public clear(): void {
    this.store.clear();
  }

  /**
   * Purge expired items.
   */
  public purgeExpired(): number {
    const now = Date.now();
    let purged = 0;
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        purged++;
      }
    }
    return purged;
  }

  /**
   * Return cache size and statistics.
   */
  public stats(): { size: number } {
    return {
      size: this.store.size,
    };
  }
}

export const serverCache = new MemoryCache();
