const { z } = require('zod');

/**
 * Enterprise Schema Validation Middleware
 * Enforces strict body, query, and params validation.
 * Strips unknown fields to prevent mass-assignment and prototype pollution.
 */
const validate = ({ body, query, params } = {}) => {
  return async (req, res, next) => {
    try {
      if (body) {
        req.body = await body.parseAsync(req.body);
      }
      if (query) {
        req.query = await query.parseAsync(req.query);
      }
      if (params) {
        req.params = await params.parseAsync(req.params);
      }
      return next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          code: err.code,
          message: err.message,
        }));

        return res.status(422).json({
          success: false,
          code: 'VALIDATION_FAILED',
          message: 'فشل التحقق من صحة البيانات المدخلة',
          errors: formattedErrors,
        });
      }
      return next(error);
    }
  };
};

module.exports = validate;
