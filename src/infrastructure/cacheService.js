const { LRUCache } = require('lru-cache');
const { getRedisClient } = require('../config/redis');

class MultiLayerCacheService {
  constructor() {
    this.redis = getRedisClient();
    
    // Layer 1: In-Memory LRU Cache with conservative sizing
    this.l1 = new LRUCache({
      max: 1000, // Maximum items in memory
      ttl: 1000 * 30, // 30 seconds default L1 TTL
    });

    this.beta = 1.0; // Optimal coefficient for XFetch algorithm
  }

  /**
   * Retrieves data using multi-layer cache or runs fetchFn with Stampede Protection
   * @param {string} key Cache key
   * @param {Function} fetchFn Asynchronous fallback computation function
   * @param {number} ttlSeconds L2 Time to live in seconds (default 300s = 5m)
   */
  async getOrSet(key, fetchFn, ttlSeconds = 300) {
    // 1. Check L1 Memory (Sub-millisecond)
    const l1Value = this.l1.get(key);
    if (l1Value !== undefined) {
      return l1Value;
    }

    // 2. Check L2 Redis
    try {
      const raw = await this.redis.get(key);
      if (raw) {
        const entry = JSON.parse(raw);
        const { value, delta, expiry } = entry;
        const now = Date.now();

        // XFetch Stampede Algorithm: now - (delta * beta * ln(random)) > expiry
        const shouldEarlyRecompute = (now - (delta * this.beta * Math.log(Math.random()))) > expiry;

        if (!shouldEarlyRecompute) {
          this.l1.set(key, value);
          return value;
        }

        // Recompute asynchronously in background without blocking response
        this._recomputeInBackground(key, fetchFn, ttlSeconds);
        this.l1.set(key, value);
        return value;
      }
    } catch (err) {
      console.warn(`[Cache Error L2]: ${err.message}. Proceeding to compute directly.`);
    }

    // 3. Cache Miss: Lock and compute
    return this._lockAndCompute(key, fetchFn, ttlSeconds);
  }

  async _lockAndCompute(key, fetchFn, ttlSeconds) {
    const lockKey = `lock:${key}`;
    let acquired = false;

    try {
      if (typeof this.redis.set === 'function') {
        const result = await this.redis.set(lockKey, '1', 'NX', 'PX', 5000);
        acquired = result === 'OK' || result === 1;
      }
    } catch (e) {
      acquired = true;
    }

    if (!acquired) {
      // Small randomized jitter wait and retry to get cached value
      await new Promise((resolve) => setTimeout(resolve, 80 + Math.random() * 40));
      return this.getOrSet(key, fetchFn, ttlSeconds);
    }

    try {
      const start = Date.now();
      const value = await fetchFn();
      const delta = Date.now() - start;

      const payload = {
        value,
        delta,
        expiry: Date.now() + (ttlSeconds * 1000),
      };

      try {
        await this.redis.set(key, JSON.stringify(payload), 'EX', ttlSeconds);
      } catch (err) {
        // Silently continue if Redis write fails
      }

      this.l1.set(key, value);
      return value;
    } finally {
      try {
        await this.redis.del(lockKey);
      } catch (e) {}
    }
  }

  _recomputeInBackground(key, fetchFn, ttlSeconds) {
    setImmediate(async () => {
      try {
        await this._lockAndCompute(key, fetchFn, ttlSeconds);
      } catch (err) {
        console.error(`[Background Cache Recompute Error for ${key}]:`, err.message);
      }
    });
  }

  async invalidate(...keys) {
    for (const key of keys) {
      this.l1.delete(key);
      try {
        await this.redis.del(key);
      } catch (e) {}
    }
  }

  async invalidatePattern(prefix) {
    this.l1.clear();
    // In production Redis, avoid raw KEYS; use SCAN or tag-based sets
    try {
      if (typeof this.redis.keys === 'function') {
        const keys = await this.redis.keys(`${prefix}*`);
        if (keys && keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
    } catch (e) {}
  }
}

module.exports = new MultiLayerCacheService();
