const express = require('express');
const router = express.Router();
const {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand
} = require('../controllers/brandController');
const { protect, authorize } = require('../middleware/auth');

router.route('/').get(getBrands).post(protect, authorize('admin'), createBrand);
router
  .route('/:id')
  .get(getBrand)
  .put(protect, authorize('admin'), updateBrand)
  .delete(protect, authorize('admin'), deleteBrand);

module.exports = router;
