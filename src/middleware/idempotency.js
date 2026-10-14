const crypto = require('crypto');
const { getRedisClient } = require('../config/redis');

/**
 * Idempotency & Deduplication Middleware
 * Mandates or inspects Idempotency-Key on mutating actions.
 * Guarantees exactly-once execution semantics for orders & transactions.
 */
const idempotencyMiddleware = ({ required = false, ttlSeconds = 86400 } = {}) => {
  return async (req, res, next) => {
    // Only apply to mutating requests
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];

    if (!idempotencyKey) {
      if (required) {
        return res.status(400).json({
          success: false,
          code: 'MISSING_IDEMPOTENCY_KEY',
          message: 'هذا الإجراء الحرج يتطلب تزويد ترويسة Idempotency-Key لضمان عدم التكرار',
        });
      }
      return next();
    }

    const redis = getRedisClient();
    const userScope = req.user ? req.user._id : (req.ip || 'anon');
    const storageKey = `idemp:${userScope}:${idempotencyKey}`;

    // Generate SHA-256 fingerprint of request body and path
    const payloadRaw = JSON.stringify({ path: req.originalUrl, body: req.body || {} });
    const payloadHash = crypto.createHash('sha256').update(payloadRaw).digest('hex');

    try {
      // 1. Attempt atomic SET NX
      const initialRecord = JSON.stringify({
        state: 'PENDING',
        hash: payloadHash,
        createdAt: Date.now(),
      });

      let acquired = false;
      if (typeof redis.set === 'function') {
        const result = await redis.set(storageKey, initialRecord, 'NX', 'EX', ttlSeconds);
        acquired = result === 'OK' || result === 1;
      }

      if (!acquired) {
        // Key already exists! Retrieve stored record
        const rawExisting = await redis.get(storageKey);
        if (rawExisting) {
          const existing = JSON.parse(rawExisting);

          // Payload mismatch check: client used same key with different body!
          if (existing.hash !== payloadHash) {
            return res.status(422).json({
              success: false,
              code: 'IDEMPOTENCY_PAYLOAD_MISMATCH',
              message: 'تم استخدام مفتاح التكرار (Idempotency Key) نفسه مع بيانات طلب مختلفة',
            });
          }

          // Request still in-flight
          if (existing.state === 'PENDING') {
            return res.status(409).json({
              success: false,
              code: 'CONCURRENT_REQUEST_IN_FLIGHT',
              message: 'طلب مطابق قيد المعالجة حالياً. يرجى الانتظار للحظات والتحقق من النتيجة',
            });
          }

          // Replay cached completed response
          res.setHeader('X-Cache-Lookup', 'IDEMPOTENT_REPLAY');
          return res.status(existing.statusCode || 200).json(existing.body);
        }
      }

      // Intercept res.json to cache response upon successful completion
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        // Only cache idempotent success responses or valid client outcomes (not 500s)
        if (res.statusCode < 500) {
          const responsePayload = JSON.stringify({
            state: 'COMPLETED',
            hash: payloadHash,
            statusCode: res.statusCode,
            body,
            completedAt: Date.now(),
          });
          redis.set(storageKey, responsePayload, 'EX', ttlSeconds).catch(() => {});
        } else {
          // On server failure, delete lock to allow clean retry
          redis.del(storageKey).catch(() => {});
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      console.warn(`[Idempotency Warning]: ${err.message}`);
      next();
    }
  };
};

module.exports = idempotencyMiddleware;
