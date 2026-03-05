var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var swaggerUi = require('swagger-ui-express');
var swaggerSpec = require('./src/config/swagger');
require('dotenv').config();

var indexRouter = require('./src/routes/index');
var usersRouter = require('./src/routes/users');
var authRouter = require('./src/routes/auth');
var dashboardRouter = require('./src/routes/dashboard');
var permissionsRouter = require('./src/routes/permissions');
var presencesRouter = require('./src/routes/presences');
var logbooksRouter = require('./src/routes/logbooks');
var internshipsRouter = require('./src/routes/internships');
var announcementsRouter = require('./src/routes/announcements');
var tasksRouter = require('./src/routes/tasks');
var auditLogsRouter = require('./src/routes/auditLogs');
var reportsRouter = require('./src/routes/reports');
var materialsRouter = require('./src/routes/materials');


var app = express();

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173', // Vite frontend (development)
  'http://localhost:3000', // Alternative development port
  // Add production frontend URL here when deploying
  // 'https://yourdomain.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Simagang API Docs'
}));

// API Routes
app.use('/api', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/permissions', permissionsRouter);
app.use('/api/presences', presencesRouter);
app.use('/api/logbooks', logbooksRouter);
app.use('/api/internships', internshipsRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/materials', materialsRouter);


// Error handling middleware
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: {
      message: err.message
    }
  });
});

module.exports = app;
