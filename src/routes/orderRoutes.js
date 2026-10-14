const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder,
} = require('../controllers/orderController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createOrderSchema } = require('../validations/orderValidation');
const { orderCreationLimiter } = require('../middleware/rateLimiter');
const idempotencyMiddleware = require('../middleware/idempotency');

router.post(
  '/',
  orderCreationLimiter,
  optionalAuth,
  idempotencyMiddleware({ required: false }),
  validate({ body: createOrderSchema }),
  createOrder
);

router.get('/myorders', protect, getMyOrders);

router.get('/', protect, authorize('admin'), getAllOrders);
router.get('/:id', optionalAuth, getOrderById);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);
router.put('/:id/payment', protect, authorize('admin'), updatePaymentStatus);
router.delete('/:id', protect, authorize('admin'), deleteOrder);

module.exports = router;
