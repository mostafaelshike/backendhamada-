const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoose = require('mongoose');
const errorHandler = require('./middleware/errorHandler');
const eventLoopMonitor = require('./utils/eventLoopLag');
const { publicApiLimiter } = require('./middleware/rateLimiter');
const { getRedisClient } = require('./config/redis');

// Route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const brandRoutes = require('./routes/brandRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const contactRoutes = require('./routes/contactRoutes');
const statsRoutes = require('./routes/statsRoutes');
const settingRoutes = require('./routes/settingRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// 1. Enterprise Security Headers via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Permit frontend assets
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  })
);

// 2. Performance & Compression
app.use(compression());

// 3. CORS Configuration
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Idempotency-Key', 'x-idempotency-key'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'Retry-After', 'X-Cache-Lookup'],
  })
);

// 4. Strict Payload Limits to Prevent Memory Exhaustion / Buffer Overflow
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 5. Apply Global Sliding-Window Rate Limiting
app.use('/api', publicApiLimiter);

// 6. Enterprise Health Check & Cluster Diagnostics
app.get('/api/health', (req, res) => {
  const mem = process.memoryUsage();
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const lagMetrics = eventLoopMonitor.getMetrics();

  res.status(200).json({
    status: 'healthy',
    message: 'سوق طبي API يعمل بكفاءة وتوافق عالي (Medical Market API is running smoothly)',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: { status: dbStatus },
    eventLoopLag: lagMetrics,
    memory: {
      rssMb: (mem.rss / 1024 / 1024).toFixed(2),
      heapUsedMb: (mem.heapUsed / 1024 / 1024).toFixed(2),
      heapTotalMb: (mem.heapTotal / 1024 / 1024).toFixed(2),
    },
  });
});

// Liveness & Readiness Probes (K8s / ALB)
app.get('/healthz/liveness', (req, res) => {
  res.status(200).send('OK');
});

app.get('/healthz/readiness', (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  if (dbReady) {
    return res.status(200).send('READY');
  }
  return res.status(503).send('DATABASE_NOT_READY');
});

app.get('/', (req, res) => {
  res.status(200).json({
    name: 'سوق طبي - Medical Market Backend API (Enterprise Edition)',
    version: '2.0.0',
    architecture: 'Stateless, Multi-Layer Cached, Saga-Enabled, Concurrency-Safe',
    health: '/api/health',
  });
});

// 7. Mount Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/upload', uploadRoutes);

// Catch 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `المسار المطلوب غير موجود: ${req.originalUrl}`,
  });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
