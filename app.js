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

var app = express();

// CORS Configuration
app.use(cors({
  origin: 'http://localhost:5173', // Vite frontend port
  credentials: true
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
app.use('/api/permissions', permissionsRouter);
app.use('/api/presences', presencesRouter);

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
