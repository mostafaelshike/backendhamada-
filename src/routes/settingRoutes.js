const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const { protect, authorize } = require('../middleware/auth');

router.route('/').get(getSettings).put(protect, authorize('admin'), updateSettings);

module.exports = router;
