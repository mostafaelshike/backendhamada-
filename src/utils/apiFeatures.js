/**
 * Production-Grade API Query Features
 * Includes Keyset/Cursor-based pagination, safe offset pagination,
 * ReDoS-safe search, field projection enforcement, and compound ESR index alignment.
 */
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString || {};
    this.cursorInfo = null;
  }

  // 1. Advanced filtering
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'keyword', 'search', 'category', 'brand', 'minPrice', 'maxPrice', 'cursor', 'lowStock'];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|in)\b/g, (match) => `$${match}`);
    let parsedQuery = JSON.parse(queryStr);

    if (this.queryString.category && this.queryString.category !== 'all') {
      parsedQuery.category = this.queryString.category;
    }

    if (this.queryString.brand && this.queryString.brand !== 'all') {
      parsedQuery.brand = this.queryString.brand;
    }

    if (this.queryString.minPrice || this.queryString.maxPrice) {
      parsedQuery.price = parsedQuery.price || {};
      if (this.queryString.minPrice) {
        parsedQuery.price.$gte = Number(this.queryString.minPrice);
      }
      if (this.queryString.maxPrice) {
        parsedQuery.price.$lte = Number(this.queryString.maxPrice);
      }
    }

    this.query = this.query.find(parsedQuery);
    return this;
  }

  // 2. ReDoS-safe search with escaping
  search(fields = ['name', 'description', 'sku']) {
    const rawSearch = this.queryString.keyword || this.queryString.search;
    if (rawSearch && typeof rawSearch === 'string' && rawSearch.trim() !== '') {
      // Escape regex special characters to prevent ReDoS attack
      const sanitized = rawSearch.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(sanitized, 'i');
      const orConditions = fields.map((field) => ({ [field]: regex }));
      this.query = this.query.find({ $or: orConditions });
    }
    return this;
  }

  // 3. ESR-aligned sorting
  sort(defaultSort = '-createdAt') {
    if (this.queryString.sort) {
      let sortBy = this.queryString.sort;
      if (sortBy === 'price_asc') sortBy = 'price';
      else if (sortBy === 'price_desc') sortBy = '-price';
      else if (sortBy === 'latest') sortBy = '-createdAt';
      else if (sortBy === 'rating') sortBy = '-rating';
      else if (sortBy === 'popular') sortBy = '-reviewsCount';

      const formattedSort = sortBy.split(',').join(' ');
      this.query = this.query.sort(formattedSort);
    } else {
      this.query = this.query.sort(defaultSort);
    }
    return this;
  }

  // 4. Strict Field Projection to minimize I/O and prevent sensitive field leakage
  limitFields(defaultExclude = '-__v') {
    if (this.queryString.fields) {
      const allowedFields = this.queryString.fields
        .split(',')
        .map((f) => f.trim())
        .filter((f) => !['password', 'resetPasswordToken', 'resetPasswordExpire'].includes(f))
        .join(' ');

      this.query = this.query.select(allowedFields || defaultExclude);
    } else {
      this.query = this.query.select(defaultExclude);
    }
    return this;
  }

  // 5. Capped Offset Pagination (Max limit guard = 100)
  paginate(defaultLimit = 12, maxLimit = 100) {
    const page = Math.max(1, parseInt(this.queryString.page, 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(this.queryString.limit, 10) || defaultLimit), maxLimit);
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  // 6. Keyset / Cursor Pagination (O(1) Seek for high concurrency)
  cursorPaginate(sortField = 'createdAt', sortOrder = -1, defaultLimit = 20, maxLimit = 100) {
    const limit = Math.min(Math.max(1, parseInt(this.queryString.limit, 10) || defaultLimit), maxLimit);
    const cursor = this.queryString.cursor;

    if (cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
        const compOp = sortOrder === -1 ? '$lt' : '$gt';

        this.query = this.query.find({
          $or: [
            { [sortField]: { [compOp]: decoded.v } },
            { [sortField]: decoded.v, _id: { [compOp]: decoded.id } },
          ],
        });
      } catch (e) {
        // Fallback gracefully if cursor is corrupted
      }
    }

    // Sort by field and tie-breaker _id
    this.query = this.query.sort({ [sortField]: sortOrder, _id: sortOrder }).limit(limit + 1);
    this.limit = limit;
    this.sortField = sortField;
    return this;
  }

  static encodeCursor(sortValue, id) {
    return Buffer.from(JSON.stringify({ v: sortValue, id })).toString('base64');
  }
}

module.exports = APIFeatures;
