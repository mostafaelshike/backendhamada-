const Contact = require('../models/Contact');
const APIFeatures = require('../utils/apiFeatures');

// @desc    Submit contact message
// @route   POST /api/contact
// @access  Public
exports.submitContact = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    const contact = await Contact.create({
      name,
      email,
      phone: phone || '',
      subject,
      message
    });

    res.status(201).json({
      success: true,
      message: 'تم إرسال رسالتك بنجاح، سيتواصل معك فريق الدعم قريباً',
      data: contact
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all contact messages (Admin)
// @route   GET /api/contact
// @access  Private/Admin
exports.getAllContacts = async (req, res, next) => {
  try {
    const features = new APIFeatures(Contact.find(), req.query)
      .search(['name', 'email', 'phone', 'subject', 'message'])
      .filter()
      .sort()
      .paginate();

    const contacts = await features.query;
    const total = await Contact.countDocuments();

    res.status(200).json({
      success: true,
      count: contacts.length,
      total,
      data: contacts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update contact status or reply
// @route   PUT /api/contact/:id
// @access  Private/Admin
exports.updateContact = async (req, res, next) => {
  try {
    const { status, reply } = req.body;
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ success: false, message: 'الرسالة غير موجودة' });
    }

    if (status) contact.status = status;
    if (reply) {
      contact.reply = reply;
      contact.repliedAt = Date.now();
      contact.status = 'replied';
    }

    await contact.save();

    res.status(200).json({
      success: true,
      message: 'تم تحديث حالة الرسالة',
      data: contact
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete contact message
// @route   DELETE /api/contact/:id
// @access  Private/Admin
exports.deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'الرسالة غير موجودة' });
    }

    await Contact.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'تم حذف الرسالة بنجاح'
    });
  } catch (error) {
    next(error);
  }
};
