const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Category = require('../models/Category');
const Brand = require('../models/Brand');

const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalProducts,
      activeProducts,
      totalCategories,
      totalBrands,
      totalUsers,
      totalOrders,
      lowStockCount,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      revenueAgg,
      recentOrders,
      topProducts,
      categories,
      lowStockProducts,
      recentUsers
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Category.countDocuments(),
      Brand.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Order.countDocuments(),
      Product.countDocuments({ $expr: { $lte: ['$stock', '$minStockAlert'] } }),
      Order.countDocuments({ orderStatus: 'pending' }),
      Order.countDocuments({ orderStatus: 'processing' }),
      Order.countDocuments({ orderStatus: 'shipped' }),
      Order.countDocuments({ orderStatus: 'delivered' }),
      Order.countDocuments({ orderStatus: 'cancelled' }),
      Order.aggregate([
        { $match: { paymentStatus: 'paid', orderStatus: { $ne: 'cancelled' } } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
      ]),
      Order.find()
        .sort('-createdAt')
        .limit(7)
        .populate('user', 'name email avatar')
        .populate('items.product', 'name sku image')
        .lean(),
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'cancelled' }, paymentStatus: 'paid' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            unitsSold: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.total' }
          }
        },
        { $sort: { unitsSold: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: Product.collection.name,
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $project: {
            _id: '$product._id',
            name: '$product.name',
            sku: '$product.sku',
            image: '$product.image',
            price: '$product.price',
            stock: '$product.stock',
            unitsSold: 1,
            revenue: 1
          }
        }
      ]),
      Product.aggregate([
        { $group: { _id: '$category', productCount: { $sum: 1 } } },
        {
          $lookup: {
            from: Category.collection.name,
            localField: '_id',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: '$category' },
        { $sort: { productCount: -1 } },
        { $limit: 5 },
        { $project: { _id: 0, name: '$category.name', productCount: 1 } }
      ]),
      Product.find({ $expr: { $lte: ['$stock', '$minStockAlert'] } })
        .select('name sku stock minStockAlert image')
        .sort({ stock: 1 })
        .lean(),
      User.find({ role: 'user' })
        .select('name email organization createdAt')
        .sort('-createdAt')
        .limit(5)
        .lean()
    ]);

    const startMonth = new Date();
    startMonth.setUTCDate(1);
    startMonth.setUTCHours(0, 0, 0, 0);
    startMonth.setUTCMonth(startMonth.getUTCMonth() - 5);
    const endMonth = new Date();
    endMonth.setUTCDate(1);
    endMonth.setUTCHours(0, 0, 0, 0);
    endMonth.setUTCMonth(endMonth.getUTCMonth() + 1);

    const monthlySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startMonth, $lt: endMonth },
          orderStatus: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0]
            }
          },
          orders: { $sum: 1 }
        }
      }
    ]);

    const salesByMonth = new Map(
      monthlySales.map((month) => [`${month._id.year}-${month._id.month}`, month])
    );
    const chartCategories = [];
    const revenueSeries = [];
    const orderSeries = [];
    for (let offset = 0; offset < 6; offset += 1) {
      const date = new Date(Date.UTC(startMonth.getUTCFullYear(), startMonth.getUTCMonth() + offset, 1));
      const month = salesByMonth.get(`${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`);
      chartCategories.push(months[date.getUTCMonth()]);
      revenueSeries.push(month ? Math.round(month.revenue) : 0);
      orderSeries.push(month ? month.orders : 0);
    }

    res.status(200).json({
      success: true,
      data: {
        totals: {
          totalRevenue: revenueAgg.length > 0 ? Math.round(revenueAgg[0].totalRevenue) : 0,
          totalOrders,
          totalProducts,
          activeProducts,
          totalCategories,
          totalBrands,
          totalUsers,
          lowStockCount,
          ordersStatus: {
            pending: pendingOrders,
            processing: processingOrders,
            shipped: shippedOrders,
            delivered: deliveredOrders,
            cancelled: cancelledOrders
          }
        },
        charts: {
          salesChart: {
            categories: chartCategories,
            series: [
              { name: 'المبيعات المحصلة (ر.س)', data: revenueSeries },
              { name: 'الطلبات غير الملغاة', data: orderSeries }
            ]
          },
          categoryChart: {
            labels: categories.map((category) => category.name),
            series: categories.map((category) => category.productCount)
          }
        },
        recentOrders,
        topProducts,
        lowStockProducts,
        recentUsers
      }
    });
  } catch (error) {
    next(error);
  }
};
