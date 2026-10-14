const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const APIFeatures = require('../utils/apiFeatures');
const cacheService = require('../infrastructure/cacheService');

// @desc    Get all products with advanced filtering, search, sorting & cursor/offset pagination
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    let queryCopy = { ...req.query };
    const lowStockOnly = queryCopy.lowStock === 'true';
    delete queryCopy.lowStock;
    const baseFilter = lowStockOnly
      ? { $expr: { $lte: ['$stock', '$minStockAlert'] } }
      : {};

    // Resolve category slug or name to ID if needed
    if (queryCopy.category && queryCopy.category !== 'all' && !/^[0-9a-fA-F]{24}$/.test(queryCopy.category)) {
      const cat = await Category.findOne({
        $or: [{ slug: queryCopy.category }, { name: queryCopy.category }],
      }).lean();
      if (cat) {
        queryCopy.category = cat._id.toString();
      } else {
        delete queryCopy.category;
      }
    }

    // Resolve brand slug or name to ID if needed
    if (queryCopy.brand && queryCopy.brand !== 'all' && !/^[0-9a-fA-F]{24}$/.test(queryCopy.brand)) {
      const b = await Brand.findOne({
        $or: [{ slug: queryCopy.brand }, { name: queryCopy.brand }, { nameAr: queryCopy.brand }],
      }).lean();
      if (b) {
        queryCopy.brand = b._id.toString();
      } else {
        delete queryCopy.brand;
      }
    }

    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 12), 100);

    // Support Cursor-Based Pagination for infinite scroll / high throughput
    if (req.query.cursor) {
      const features = new APIFeatures(
        Product.find(baseFilter).populate('category', 'name nameEn slug icon').populate('brand', 'name nameAr slug logo country'),
        queryCopy
      )
        .search(['name', 'description', 'sku', 'brandName', 'categoryName', 'tags'])
        .filter()
        .limitFields()
        .cursorPaginate('createdAt', -1, limit, 100);

      const rawItems = await features.query.lean();
      const hasNextPage = rawItems.length > limit;
      const items = hasNextPage ? rawItems.slice(0, limit) : rawItems;
      const lastItem = items[items.length - 1];
      const nextCursor = (hasNextPage && lastItem) ? APIFeatures.encodeCursor(lastItem.createdAt, lastItem._id) : null;

      return res.status(200).json({
        success: true,
        count: items.length,
        pagination: {
          limit,
          hasNextPage,
          nextCursor,
        },
        data: items,
      });
    }

    // Standard Capped Offset Pagination
    const countFeatures = new APIFeatures(Product.find(baseFilter), queryCopy)
      .search(['name', 'description', 'sku', 'brandName', 'categoryName', 'tags'])
      .filter();
    const totalMatching = await countFeatures.query.countDocuments();

    const features = new APIFeatures(
      Product.find(baseFilter).populate('category', 'name nameEn slug icon').populate('brand', 'name nameAr slug logo country'),
      queryCopy
    )
      .search(['name', 'description', 'sku', 'brandName', 'categoryName', 'tags'])
      .filter()
      .sort()
      .limitFields()
      .paginate(limit, 100);

    const products = await features.query.lean();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const totalPages = Math.ceil(totalMatching / limit);

    res.status(200).json({
      success: true,
      count: products.length,
      total: totalMatching,
      totalPages,
      currentPage: page,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured products with Multi-Layer Cache
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 8), 24);
    const cacheKey = `featured_products:${limit}`;

    const products = await cacheService.getOrSet(
      cacheKey,
      async () => {
        return Product.find({ isActive: true, isFeatured: true })
          .populate('category', 'name slug')
          .populate('brand', 'name logo')
          .limit(limit)
          .lean();
      },
      300 // 5 minutes cache
    );

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID or SKU with Multi-Layer Cache & Stampede Protection
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const identifier = req.params.id;
    const cacheKey = `product:${identifier}`;

    const result = await cacheService.getOrSet(
      cacheKey,
      async () => {
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
        const product = isObjectId
          ? await Product.findById(identifier)
              .populate('category', 'name nameEn slug icon')
              .populate('brand', 'name nameAr slug logo country website')
              .lean()
          : await Product.findOne({ sku: identifier })
              .populate('category', 'name nameEn slug icon')
              .populate('brand', 'name nameAr slug logo country website')
              .lean();

        if (!product) return null;

        const relatedProducts = await Product.find({
          category: product.category,
          _id: { $ne: product._id },
          isActive: true,
        })
          .limit(4)
          .select('name price oldPrice image rating reviewsCount badge')
          .lean();

        return { product, related: relatedProducts };
      },
      600 // 10 minutes cache
    );

    if (!result || !result.product) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }

    res.status(200).json({
      success: true,
      data: result.product,
      related: result.related,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  try {
    const productData = { ...req.body };

    if (productData.category) {
      const cat = await Category.findById(productData.category);
      if (cat) {
        productData.categoryName = cat.name;
        cat.productCount = (cat.productCount || 0) + 1;
        await cat.save();
      }
    }

    if (productData.brand) {
      const br = await Brand.findById(productData.brand);
      if (br) {
        productData.brandName = br.name;
        br.productCount = (br.productCount || 0) + 1;
        await br.save();
      }
    }

    if (productData.oldPrice && productData.oldPrice > productData.price) {
      const discount = Math.round(((productData.oldPrice - productData.price) / productData.oldPrice) * 100);
      productData.badgePrice = `وفر ${discount}%`;
    }

    const product = await Product.create(productData);

    // Invalidate product collection caches
    await cacheService.invalidatePattern('featured_products');

    res.status(201).json({
      success: true,
      message: 'تم إضافة المنتج الطبي بنجاح',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
  try {
    const productData = { ...req.body };

    if (productData.category) {
      const cat = await Category.findById(productData.category);
      if (cat) productData.categoryName = cat.name;
    }

    if (productData.brand) {
      const br = await Brand.findById(productData.brand);
      if (br) productData.brandName = br.name;
    }

    if (productData.oldPrice && productData.oldPrice > productData.price) {
      const discount = Math.round(((productData.oldPrice - productData.price) / productData.oldPrice) * 100);
      productData.badgePrice = `وفر ${discount}%`;
    }

    const product = await Product.findByIdAndUpdate(req.params.id, productData, {
      new: true,
      runValidators: true,
    })
      .populate('category', 'name slug')
      .populate('brand', 'name logo');

    if (!product) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }

    // Invalidate individual cache and collection caches
    await cacheService.invalidate(`product:${product._id}`, `product:${product.sku}`);
    await cacheService.invalidatePattern('featured_products');

    res.status(200).json({
      success: true,
      message: 'تم تحديث بيانات المنتج بنجاح',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }

    if (product.category) {
      await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });
    }
    if (product.brand) {
      await Brand.findByIdAndUpdate(product.brand, { $inc: { productCount: -1 } });
    }

    await Product.findByIdAndDelete(req.params.id);

    // Invalidate caches
    await cacheService.invalidate(`product:${product._id}`, `product:${product.sku}`);
    await cacheService.invalidatePattern('featured_products');

    res.status(200).json({
      success: true,
      message: 'تم حذف المنتج بنجاح',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get low stock products
// @route   GET /api/products/alerts/low-stock
// @access  Private/Admin
exports.getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$stock', '$minStockAlert'] },
    })
      .populate('category', 'name')
      .populate('brand', 'name')
      .lean();

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};
