const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Setting = require('../models/Setting');
const EventStore = require('../models/EventStore');
const APIFeatures = require('../utils/apiFeatures');
const cacheService = require('../infrastructure/cacheService');
const { SagaOrchestrator, SagaStep } = require('../utils/sagaOrchestrator');

// @desc    Create new order with Distributed Saga, Atomic OCC, and Event Sourcing
// @route   POST /api/orders
// @access  Public (or Private)
exports.createOrder = async (req, res, next) => {
  try {
    const { customerInfo, items, paymentMethod, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'لا توجد منتجات في الطلب' });
    }

    if (!customerInfo || !customerInfo.name || !customerInfo.phone || !customerInfo.address || !customerInfo.city) {
      return res.status(400).json({ success: false, message: 'يرجى إكمال بيانات العميل والتوصيل المطلوبة' });
    }

    // Initialize Saga for Order Workflow
    const saga = new SagaOrchestrator();

    // STEP 1: Verify Prices and Calculate Totals
    saga.addStep(
      new SagaStep({
        name: 'VERIFY_PRICES_AND_TOTALS',
        action: async (ctx) => {
          let subtotal = 0;
          const verifiedItems = [];

          for (const item of items) {
            const productId = item.product || item._id || item.id;
            const product = await Product.findById(productId).lean();
            if (!product) {
              throw new Error(`المنتج المطلوب (${productId}) غير متوفر في النظام`);
            }

            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;

            verifiedItems.push({
              product: product._id,
              name: product.name,
              image: product.image,
              sku: product.sku,
              price: product.price,
              quantity: item.quantity,
              total: itemTotal,
            });
          }

          const setting = await Setting.findOne().lean();
          const taxRate = setting ? setting.taxRate || 15 : 15;
          const standardShipping = setting ? setting.shippingFee || 35 : 35;
          const freeThreshold = setting ? setting.freeShippingThreshold || 500 : 500;

          const shippingFee = subtotal >= freeThreshold ? 0 : standardShipping;
          const tax = Math.round((subtotal * (taxRate / 100)) * 100) / 100;
          const totalAmount = Math.round((subtotal + shippingFee + tax) * 100) / 100;

          return { verifiedItems, subtotal, tax, shippingFee, totalAmount };
        },
        compensate: async () => {}, // Pure read computation, no rollback required
      })
    );

    // STEP 2: Atomic Inventory Reservation (Eliminates Race Conditions / Double-Spending)
    saga.addStep(
      new SagaStep({
        name: 'RESERVE_INVENTORY',
        action: async (ctx) => {
          const reservedItems = [];

          for (const item of ctx.verifiedItems) {
            // Atomic conditional update: only decrements if stock >= requested quantity
            const updatedProduct = await Product.findOneAndUpdate(
              {
                _id: item.product,
                stock: { $gte: item.quantity },
              },
              {
                $inc: { stock: -item.quantity },
              },
              { new: true }
            );

            if (!updatedProduct) {
              // Roll back any items reserved so far in this loop
              for (const prev of reservedItems) {
                await Product.findByIdAndUpdate(prev.product, {
                  $inc: { stock: prev.quantity },
                });
              }
              throw new Error(`نعتذر، نفد المخزون المتاح للمنتج (${item.name}) أثناء تأكيد الطلب`);
            }

            reservedItems.push(item);
          }

          return { reservedItems };
        },
        compensate: async (ctx) => {
          // Compensating Transaction: Replenish deducted stock
          if (ctx.reservedItems && ctx.reservedItems.length > 0) {
            for (const item of ctx.reservedItems) {
              await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity },
              });
            }
          }
        },
      })
    );

    // STEP 3: Persist Order Record
    saga.addStep(
      new SagaStep({
        name: 'PERSIST_ORDER',
        action: async (ctx) => {
          const order = await Order.create({
            user: req.user ? req.user._id : undefined,
            customerInfo: {
              name: customerInfo.name,
              email: customerInfo.email || (req.user ? req.user.email : 'customer@medicalmarket.com'),
              phone: customerInfo.phone,
              hospitalOrClinic: customerInfo.hospitalOrClinic || '',
              city: customerInfo.city,
              address: customerInfo.address,
              postalCode: customerInfo.postalCode || '',
              notes: notes || customerInfo.notes || '',
            },
            items: ctx.verifiedItems,
            subtotal: ctx.subtotal,
            tax: ctx.tax,
            shippingFee: ctx.shippingFee,
            discount: 0,
            totalAmount: ctx.totalAmount,
            paymentMethod: paymentMethod || 'cash_on_delivery',
            paymentStatus: paymentMethod === 'credit_card' || paymentMethod === 'mada' ? 'paid' : 'pending',
            orderStatus: 'pending',
          });

          return { order };
        },
        compensate: async (ctx) => {
          // Compensating Transaction: Mark order cancelled if downstream actions fail
          if (ctx.order) {
            await Order.findByIdAndUpdate(ctx.order._id, {
              orderStatus: 'cancelled',
              cancellationReason: 'SAGA_COMPENSATION_TRIGGERED',
            });
          }
        },
      })
    );

    // STEP 4: Event Sourcing & Audit Logging (Pillar 5)
    saga.addStep(
      new SagaStep({
        name: 'EMIT_DOMAIN_EVENTS',
        action: async (ctx) => {
          await EventStore.create([
            {
              aggregateId: ctx.order._id.toString(),
              aggregateType: 'Order',
              eventType: 'ORDER_PLACED',
              version: 1,
              payload: {
                orderNumber: ctx.order.orderNumber,
                totalAmount: ctx.order.totalAmount,
                itemsCount: ctx.verifiedItems.length,
              },
              metadata: {
                userId: req.user ? req.user._id.toString() : 'anonymous',
                ip: req.ip,
                idempotencyKey: req.headers['idempotency-key'] || '',
              },
            },
          ]);
        },
        compensate: async () => {}, // Domain events remain as an immutable audit trail
      })
    );

    // Execute Saga Orchestration
    const sagaResult = await saga.execute();

    // Clear User Cart if logged in
    if (req.user) {
      await Cart.findOneAndDelete({ user: req.user._id });
    }

    // Invalidate product caches in multi-layer cache
    for (const item of sagaResult.verifiedItems) {
      await cacheService.invalidate(`prod:${item.product}`, 'products:list');
    }

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الطلب بنجاح وفق أعلى معايير الأمان وتفادي التعارض',
      data: sagaResult.order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin with capped/cursor pagination)
// @route   GET /api/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res, next) => {
  try {
    const countFeatures = new APIFeatures(Order.find(), req.query)
      .search(['orderNumber', 'customerInfo.name', 'customerInfo.phone', 'customerInfo.city', 'customerInfo.hospitalOrClinic'])
      .filter();
    const totalMatching = await countFeatures.query.countDocuments();

    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 12), 100);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const features = new APIFeatures(
      Order.find().populate('user', 'name email phone').populate('items.product', 'name sku image'),
      req.query
    )
      .search(['orderNumber', 'customerInfo.name', 'customerInfo.phone', 'customerInfo.city', 'customerInfo.hospitalOrClinic'])
      .filter()
      .sort('-createdAt')
      .paginate(limit, 100);

    const orders = await features.query.lean();

    res.status(200).json({
      success: true,
      count: orders.length,
      total: totalMatching,
      totalPages: Math.ceil(totalMatching / limit),
      currentPage: page,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort('-createdAt')
      .populate('items.product', 'name image sku')
      .lean();

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order by ID or orderNumber
// @route   GET /api/orders/:id
// @access  Public (or Private)
exports.getOrderById = async (req, res, next) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const order = isObjectId
      ? await Order.findById(req.params.id).populate('user', 'name email phone').populate('items.product', 'name sku image').lean()
      : await Order.findOne({ orderNumber: req.params.id }).populate('user', 'name email phone').populate('items.product', 'name sku image').lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, trackingNumber, medicalVerificationStatus } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (medicalVerificationStatus) order.medicalVerificationStatus = medicalVerificationStatus;

    if (orderStatus === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = Date.now();
      order.paymentStatus = 'paid';
    }

    await order.save();

    // Audit state transition in EventStore
    await EventStore.create({
      aggregateId: order._id.toString(),
      aggregateType: 'Order',
      eventType: 'ORDER_STATUS_UPDATED',
      version: 2,
      payload: { orderStatus, trackingNumber },
      metadata: { userId: req.user ? req.user._id.toString() : 'admin', ip: req.ip },
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'تم تحديث حالة الطلب بنجاح',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update payment status
// @route   PUT /api/orders/:id/payment
// @access  Private/Admin
exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { paymentStatus } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    order.paymentStatus = paymentStatus;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'تم تحديث حالة الدفع بنجاح',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    await Order.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'تم حذف الطلب بنجاح',
    });
  } catch (error) {
    next(error);
  }
};
