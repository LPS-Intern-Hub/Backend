const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Simagang API Documentation',
      version: '1.0.0',
      description: `
API Documentation for Simagang - Internship Management System

## Available Endpoints:

### Authentication
- POST /auth/login - Login user
- GET /auth/me - Get current user profile

### Internships
- GET /internships/me - Get current user's internship
- GET /internships - Get all internships (Admin only)
- GET /internships/{id} - Get internship by ID (Admin only)
- POST /internships - Create new internship (Admin only)
- PUT /internships/{id} - Update internship (Admin only)
- DELETE /internships/{id} - Delete internship (Admin only)

### Dashboard
- GET /dashboard - Get dashboard data (progress, attendance, logbook)

### Permissions (Perizinan)
- GET /permissions - Get all permissions (filter by status, type)
- GET /permissions/{id} - Get permission by ID
- POST /permissions - Create new permission (with file upload)
- PUT /permissions/{id} - Update permission
- DELETE /permissions/{id} - Delete permission
- PUT /permissions/{id}/review - Approve/reject permission (mentor/kadiv)

### Presences (Presensi)
- POST /presences/check-in - Check-in with photo
- POST /presences/check-out - Check-out
- GET /presences/today - Get today's presence
- GET /presences - Get all presences (filter by month, year, status)


### Logbooks
- GET /logbooks - Get all logbooks (filter by month, year, status)
- POST /logbooks - Create new logbook (draft/sent)
- PUT /logbooks/{id} - Update logbook
- DELETE /logbooks/{id} - Delete logbook
- PUT /logbooks/{id}/review - Approve/reject logbook (mentor/kadiv)

      `,
      contact: {
        name: 'API Support',
        email: 'support@simagang.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.simagang.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User ID'
            },
            full_name: {
              type: 'string',
              description: 'Full name of the user'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            role: {
              type: 'string',
              enum: ['intern', 'mentor', 'SDM', 'kadiv'],
              description: 'User role'
            },
            position: {
              type: 'string',
              description: 'User position'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation date'
            }
          }
        },
        Permission: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Permission ID'
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              description: 'User ID who created the permission'
            },
            type: {
              type: 'string',
              enum: ['sakit', 'izin'],
              description: 'Permission type'
            },
            title: {
              type: 'string',
              description: 'Permission title'
            },
            reason: {
              type: 'string',
              description: 'Reason for permission'
            },
            start_date: {
              type: 'string',
              format: 'date',
              description: 'Start date of permission'
            },
            end_date: {
              type: 'string',
              format: 'date',
              description: 'End date of permission'
            },
            attachment_path: {
              type: 'string',
              nullable: true,
              description: 'Path to attachment file'
            },
            status: {
              type: 'string',
              enum: ['sent', 'review_mentor', 'review_kadiv', 'approved', 'rejected'],
              description: 'Permission status'
            }
          }
        },
        Presence: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Presence ID'
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              description: 'User ID'
            },
            date: {
              type: 'string',
              format: 'date',
              description: 'Presence date'
            },
            check_in: {
              type: 'string',
              format: 'time',
              nullable: true,
              description: 'Check-in time'
            },
            check_out: {
              type: 'string',
              format: 'time',
              nullable: true,
              description: 'Check-out time'
            },
            location: {
              type: 'string',
              description: 'Presence location'
            },
            image_url: {
              type: 'string',
              description: 'URL to presence photo'
            },
            status: {
              type: 'string',
              enum: ['present', 'permission', 'sick', 'alpha'],
              description: 'Presence status'
            }
          }
        },
        Logbook: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Logbook ID'
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              description: 'User ID'
            },
            date: {
              type: 'string',
              format: 'date',
              description: 'Logbook date'
            },
            title: {
              type: 'string',
              description: 'Logbook title'
            },
            activity_detail: {
              type: 'string',
              description: 'Detail of activities'
            },
            result_output: {
              type: 'string',
              description: 'Result or output of activities'
            },
            status: {
              type: 'string',
              enum: ['draft', 'sent', 'review_mentor', 'review_kadiv', 'approved', 'rejected'],
              description: 'Logbook status'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object'
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Success message'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js'] // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
