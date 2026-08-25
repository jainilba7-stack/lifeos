const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const errorHandler = require('./middleware/errorMiddleware');
const { protect } = require('./middleware/authMiddleware');
const { generateSmartInsights } = require('./services/insightsService');
const ApiResponse = require('./utils/apiResponse');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const documentRoutes = require('./routes/documentRoutes');
const goalRoutes = require('./routes/goalRoutes');
const habitRoutes = require('./routes/habitRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const noteRoutes = require('./routes/noteRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const profileRoutes = require('./routes/profileRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const searchRoutes = require('./routes/searchRoutes');

const app = express();

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Dynamic CORS configuration inside code (independent of .env settings)
app.use(
  cors({
    origin: function (origin, callback) {
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
  })
);

// Handle preflight OPTIONS requests for all endpoints
app.options('*', cors());

// Express Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', limiter);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Asset Routes
const uploadsPath = path.join(__dirname, '../uploads');
const frontendPath = path.join(__dirname, '../../frontend');

app.use('/uploads', express.static(uploadsPath));
app.use(express.static(frontendPath));
app.use('/pages', express.static(path.join(frontendPath, 'pages')));
app.use('/css', express.static(path.join(frontendPath, 'css')));
app.use('/js', express.static(path.join(frontendPath, 'js')));

// API Endpoint Declarations
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);

// Smart Dashboard Insights API Route
app.get('/api/dashboard/insights', protect, async (req, res, next) => {
  try {
    const insights = await generateSmartInsights(req.user.id);
    return ApiResponse.success(res, 'Smart insights calculated from live data', { insights });
  } catch (err) {
    next(err);
  }
});

// Fallback to index.html for root navigation
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
