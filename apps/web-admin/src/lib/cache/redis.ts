/**
 * Redis Cache Implementation
 * Provides caching layer for improved performance
 */

export interface CacheOptions {
  /** Time to live in seconds */
  ttl?: number;
  /** Cache key prefix */
  prefix?: string;
}

export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

/**
 * Redis cache adapter using Upstash Redis (REST API)
 */
class RedisCacheAdapter implements CacheAdapter {
  private url: string;
  private token: string;
  private prefix: string;

  constructor(url?: string, token?: string, prefix: string = 'ibimina:') {
    this.url = url || (typeof process !== 'undefined' ? process.env.UPSTASH_REDIS_REST_URL || '' : '');
    this.token = token || (typeof process !== 'undefined' ? process.env.UPSTASH_REDIS_REST_TOKEN || '' : '');
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.url || !this.token) {
      console.warn('Redis not configured, returning null');
      return null;
    }

    try {
      const response = await fetch(`${this.url}/get/${this.getKey(key)}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (!data.result) {
        return null;
      }

      return JSON.parse(data.result) as T;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.url || !this.token) {
      console.warn('Redis not configured, skipping set');
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      const url = ttl
        ? `${this.url}/setex/${this.getKey(key)}/${ttl}`
        : `${this.url}/set/${this.getKey(key)}`;

      await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: serialized,
      });
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.url || !this.token) {
      return;
    }

    try {
      await fetch(`${this.url}/del/${this.getKey(key)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  async clear(): Promise<void> {
    if (!this.url || !this.token) {
      return;
    }

    try {
      // Delete all keys with prefix
      const response = await fetch(`${this.url}/keys/${this.prefix}*`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const keys = data.result || [];
        
        for (const key of keys) {
          await this.delete(key.replace(this.prefix, ''));
        }
      }
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }
}

/**
 * In-memory cache adapter (fallback)
 */
class MemoryCacheAdapter implements CacheAdapter {
  private cache: Map<string, { value: any; expires?: number }> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    if (item.expires && item.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const item: { value: T; expires?: number } = { value };
    
    if (ttl) {
      item.expires = Date.now() + ttl * 1000;
    }

    this.cache.set(key, item);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
  }
}

/**
 * Get cache adapter (Redis if available, otherwise memory)
 */
function getCacheAdapter(): CacheAdapter {
  const redisUrl = typeof process !== 'undefined' 
    ? process.env.UPSTASH_REDIS_REST_URL 
    : '';
  const redisToken = typeof process !== 'undefined' 
    ? process.env.UPSTASH_REDIS_REST_TOKEN 
    : '';

  if (redisUrl && redisToken) {
    return new RedisCacheAdapter(redisUrl, redisToken);
  }

  return new MemoryCacheAdapter();
}

// Export singleton instance
export const cache = getCacheAdapter();

/**
 * Cache helper functions
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  const cached = await cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const value = await fetcher();
  await cache.set(key, value, ttl);
  return value;
}

/**
 * Invalidate cache by pattern
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  // This is a simplified version - in production, use SCAN for pattern matching
  console.warn('Pattern invalidation not fully implemented');
}
