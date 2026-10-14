const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes: ensure valid JWT token
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_medical_market_2026_secure_token!@#$');

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'المستخدم صاحب هذا الرمز لم يعد موجوداً في النظام'
        });
      }

      if (req.user.status === 'blocked') {
        return res.status(403).json({
          success: false,
          message: 'تم حظر هذا الحساب. يرجى التواصل مع الإدارة'
        });
      }

      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'جلسة العمل غير صالحة أو منتهية، يرجى تسجيل الدخول مرة أخرى'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح بالدخول، يرجى تزويد رمز التحقق (Token)'
    });
  }
};

/**
 * Authorize roles: check if user role is in permitted roles
 * @param  {...string} roles - e.g. 'admin', 'vendor'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `الدور (${req.user ? req.user.role : 'زائر'}) غير مصرح له بتنفيذ هذه العملية`
      });
    }
    next();
  };
};

/**
 * Optional authentication middleware: if token present, attach user; otherwise continue
 */
const optionalAuth = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_medical_market_2026_secure_token!@#$');
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Ignore token decode errors for optional auth
    }
  }
  next();
};

module.exports = {
  protect,
  authorize,
  optionalAuth
};
