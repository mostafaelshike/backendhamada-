const { getRedisClient } = require('../config/redis');

const LUA_SLIDING_WINDOW = `
  local key = KEYS[1]
  local now = tonumber(ARGV[1])
  local window = tonumber(ARGV[2])
  local limit = tonumber(ARGV[3])
  local clearBefore = now - window

  redis.call('ZREMRANGEBYSCORE', key, '-inf', clearBefore)
  local currentRequests = redis.call('ZCARD', key)

  if currentRequests < limit then
    redis.call('ZADD', key, now, now .. ':' .. ARGV[4])
    redis.call('PEXPIRE', key, window)
    return { 1, limit - currentRequests - 1 }
  else
    return { 0, 0 }
  end
`;

let luaDefined = false;

const createRateLimiter = ({
  windowMs = 60 * 1000,
  max = 100,
  message = 'تم تجاوز الحد الأقصى للطلبات المسموح بها، يرجى المحاولة لاحقاً',
  keyPrefix = 'rl',
  keyGenerator = null,
} = {}) => {
  const redis = getRedisClient();

  if (!luaDefined && typeof redis.defineCommand === 'function') {
    try {
      redis.defineCommand('slidingLimit', {
        numberOfKeys: 1,
        lua: LUA_SLIDING_WINDOW,
      });
      luaDefined = true;
    } catch (e) {}
  }

  return async (req, res, next) => {
    const identifier = keyGenerator ? keyGenerator(req) : (req.user ? `user:${req.user._id}` : `ip:${req.ip || req.headers['x-forwarded-for'] || 'client'}`);
    const key = `${keyPrefix}:${identifier}`;
    const now = Date.now();
    const nonce = Math.random().toString(36).substring(2, 8);

    try {
      let allowed = 1;
      let remaining = max;

      if (typeof redis.slidingLimit === 'function') {
        const result = await redis.slidingLimit(key, now, windowMs, max, nonce);
        allowed = Array.isArray(result) ? result[0] : 1;
        remaining = Array.isArray(result) ? result[1] : max - 1;
      } else {
        // Fallback for simple adapter
        const countKey = `c:${key}`;
        const current = (await redis.get(countKey)) || 0;
        if (Number(current) >= max) {
          allowed = 0;
          remaining = 0;
        } else {
          await redis.set(countKey, Number(current) + 1, 'EX', Math.ceil(windowMs / 1000));
          remaining = max - Number(current) - 1;
        }
      }

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));

      if (allowed === 1) {
        return next();
      }

      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      return res.status(429).json({
        success: false,
        code: 'TOO_MANY_REQUESTS',
        message,
      });
    } catch (err) {
      // In case of rate limiter subsystem failure, fail-open to preserve API availability
      console.warn(`[RateLimiter Warning]: ${err.message}`);
      return next();
    }
  };
};

module.exports = {
  createRateLimiter,
  publicApiLimiter: createRateLimiter({ windowMs: 60 * 1000, max: 120, keyPrefix: 'rl_pub' }),
  authLimiter: createRateLimiter({ windowMs: 15 * 60 * 1000, max: 15, keyPrefix: 'rl_auth', message: 'محاولات دخول كثيرة، يرجى المحاولة بعد 15 دقيقة' }),
  orderCreationLimiter: createRateLimiter({ windowMs: 60 * 1000, max: 10, keyPrefix: 'rl_order' }),
};
