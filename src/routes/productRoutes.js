const express = require('express');
const router = express.Router();
const {
  getProducts,
  getFeaturedProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

router.get('/featured', getFeaturedProducts);
router.get('/alerts/low-stock', protect, authorize('admin'), getLowStockProducts);

router.route('/').get(getProducts).post(protect, authorize('admin', 'vendor'), createProduct);
router
  .route('/:id')
  .get(getProduct)
  .put(protect, authorize('admin', 'vendor'), updateProduct)
  .delete(protect, authorize('admin'), deleteProduct);

module.exports = router;
