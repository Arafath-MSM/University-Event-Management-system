# Eventra ESRS Backend

A comprehensive PHP backend for the Eventra Event and Venue Management System.

## Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control
  - Password reset functionality
  - Email verification (framework ready)

- **Venue Management**
  - CRUD operations for venues
  - Venue availability checking
  - Search and filter venues
  - Image management

- **Booking System**
  - Create venue bookings
  - Booking approval workflow
  - Status tracking (pending, approved, rejected)
  - Facility requests

- **Event Planning**
  - Event plan creation
  - Multi-stage approval process
  - Document management
  - Approval tracking

- **Service Provider Management**
  - Service request handling
  - Provider-specific dashboards
  - Request approval workflow

- **Admin Tools**
  - User management
  - System logs
  - Analytics and reports
  - Activity tracking

## Database Schema

The system uses MySQL with the following main tables:

- `users` - User accounts and profiles
- `venues` - Venue information
- `bookings` - Venue booking requests
- `event_plans` - Event planning proposals
- `service_requests` - Service provider requests
- `notifications` - User notifications
- `activity_logs` - System activity tracking

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/password-reset` - Request password reset
- `POST /api/auth/reset-password` - Complete password reset

### Venues
- `GET /api/venues/read` - Get all venues
- `POST /api/venues/create` - Create new venue
- `PUT /api/venues/update.php` - Update venue
- `DELETE /api/venues/delete.php` - Delete venue

### Bookings
- `GET /api/bookings/read` - Get all bookings
- `POST /api/bookings/create` - Create new booking
- `PUT /api/bookings/update.php` - Update booking
- `POST /api/bookings/approve.php` - Approve booking
- `POST /api/bookings/reject.php` - Reject booking

### Users
- `GET /api/users/read` - Get all users
- `GET /api/users/read_one.php` - Get single user
- `PUT /api/users/update.php` - Update user
- `DELETE /api/users/delete.php` - Delete user

## Installation

1. **Database Setup**
   ```sql
   -- Import the database schema
   mysql -u root -p < database_schema.sql
   ```

2. **Configuration**
   - Update database credentials in `config/database.php`
   - Configure CORS settings in `config/cors.php`
   - Set JWT secret key in `utils/JWTUtil.php`

3. **Server Requirements**
   - PHP 7.4 or higher
   - MySQL 5.7 or higher
   - Apache/Nginx web server
   - PDO MySQL extension

4. **File Permissions**
   ```bash
   chmod 755 Backend/
   chmod 644 Backend/config/*.php
   chmod 644 Backend/models/*.php
   chmod 644 Backend/utils/*.php
   chmod 644 Backend/api/**/*.php
   ```

## Usage

### Authentication Flow

1. **Login**
   ```javascript
   fetch('/api/auth/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       email: 'user@example.com',
       password: 'password123',
       role: 'student'
     })
   })
   ```

2. **Using JWT Token**
   ```javascript
   fetch('/api/venues/read', {
     headers: {
       'Authorization': 'Bearer ' + token,
       'Content-Type': 'application/json'
     }
   })
   ```

### Creating a Booking

```javascript
fetch('/api/bookings/create', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user_id: 1,
    venue_id: 1,
    event_title: 'Research Conference 2025',
    description: 'Annual research conference',
    date: '2025-01-15',
    time: '10:00:00',
    participants: 600,
    facilities: ['Projector', 'Microphone']
  })
})
```

## Security Features

- **Input Sanitization** - All user inputs are sanitized
- **SQL Injection Prevention** - Prepared statements used throughout
- **JWT Authentication** - Secure token-based authentication
- **CORS Protection** - Cross-origin request handling
- **Role-based Access** - Different permissions for different user roles

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `503` - Service Unavailable

## Development

### Adding New Endpoints

1. Create the model class in `models/`
2. Create the API endpoint in `api/`
3. Update the README with endpoint documentation

### Database Migrations

For schema changes:
1. Update `database_schema.sql`
2. Create migration scripts if needed
3. Test with sample data

## Testing

### Sample Data

The database schema includes sample data:
- Default admin user: `superadmin@university.edu` / `password123`
- Sample venues and users
- Authority accounts for different roles

### API Testing

Use tools like Postman or curl to test endpoints:

```bash
# Test login
curl -X POST http://localhost/Eventra/Backend/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@university.edu","password":"password123","role":"super-admin"}'
```

## Deployment

1. **Production Setup**
   - Use HTTPS
   - Set proper file permissions
   - Configure error logging
   - Set up database backups

2. **Environment Variables**
   - Database credentials
   - JWT secret key
   - CORS origins

3. **Performance**
   - Enable PHP OPcache
   - Configure MySQL query cache
   - Use CDN for static assets

## Support

For issues and questions:
- Check the error logs
- Verify database connectivity
- Test with sample data
- Review API documentation

## License

This project is part of the Eventra ESRS system. 