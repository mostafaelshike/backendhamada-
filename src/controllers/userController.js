const User = require('../models/User');
const APIFeatures = require('../utils/apiFeatures');

// @desc    Get all users (with search, filter, pagination)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const features = new APIFeatures(User.find(), req.query)
      .search(['name', 'email', 'phone', 'organization'])
      .filter()
      .sort()
      .paginate();

    const users = await features.query;
    const countFeatures = new APIFeatures(User.find(), req.query)
      .search(['name', 'email', 'phone', 'organization'])
      .filter();
    const total = await countFeatures.query.countDocuments();

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Create user (by Admin)
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, organization, status, address } = req.body;

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني مستخدم بالفعل' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'user',
      phone: phone || '',
      organization: organization || '',
      status: status || 'active',
      address: address || {}
    });

    res.status(201).json({ success: true, message: 'تم إضافة المستخدم بنجاح', data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user (by Admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    // If password provided in update, we let the pre-save hook or bcrypt hash it if changing password
    if (updateData.password) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    res.status(200).json({ success: true, message: 'تم تحديث بيانات المستخدم', data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'لا يمكنك حذف حسابك الحالي' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    next(error);
  }
};
