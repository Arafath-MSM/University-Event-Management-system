# System Logs Implementation

This document describes the implementation of real-time system logs functionality for the Eventra ESRS system.

## Overview

The System Logs feature provides comprehensive tracking of all system activities including:
- User actions (login, logout, profile updates)
- Booking activities (creation, approval, rejection)
- Event plan activities (submission, approval, rejection)
- User management (creation, updates, deletion)
- System operations (maintenance, backups, alerts)
- Venue management activities

## Database Structure

The system uses the existing `activity_logs` table from the database schema:

```sql
CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    type ENUM('booking', 'event_plan', 'venue', 'user', 'system') NOT NULL,
    target_id INT NULL,
    target_type VARCHAR(50) NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
);
```

## Backend Components

### 1. API Endpoint
- **File**: `api/system-logs/get-system-logs.php`
- **Method**: GET
- **Purpose**: Retrieve system logs with filtering and pagination

#### Query Parameters:
- `limit`: Number of logs to return (default: 100)
- `type`: Filter by activity type (booking, event_plan, venue, user, system)
- `user_id`: Filter by specific user
- `start_date`: Filter from specific date
- `end_date`: Filter to specific date

#### Response Format:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "timestamp": "Dec 15, 2024 2:30 PM",
      "user": "Super Administrator",
      "action": "User Login",
      "type": "user",
      "target": "User",
      "details": "User logged in: superadmin@university.edu",
      "ip_address": "192.168.1.100",
      "user_role": "super-admin",
      "raw_timestamp": "2024-12-15 14:30:00"
    }
  ],
  "total": 150,
  "limit": 100,
  "message": "System logs retrieved successfully"
}
```

### 2. Activity Logger Service
- **File**: `services/ActivityLogger.php`
- **Purpose**: Centralized logging service for all system activities

#### Key Methods:
- `log()`: Generic logging method
- `logLogin()`: Log user login
- `logLogout()`: Log user logout
- `logBookingCreated()`: Log booking creation
- `logBookingApproved()`: Log booking approval
- `logEventPlanSubmitted()`: Log event plan submission
- `logUserCreated()`: Log user creation
- `logSystemAction()`: Log system-level actions

#### Usage Example:
```php
require_once '../services/ActivityLogger.php';

$logger = new ActivityLogger();
$logger->logLogin($userId, $email, $ipAddress);
```

## Frontend Components

### 1. API Service
- **File**: `FrontEnd/src/services/api.ts`
- **Method**: `getSystemLogs(params)`

### 2. Admin Tools Component
- **File**: `FrontEnd/src/pages/AdminTools.tsx`
- **Tab**: System Logs

#### Features:
- Real-time data fetching
- Advanced filtering (type, user, date range)
- Responsive table display
- Loading states
- Auto-refresh functionality

#### State Management:
```typescript
const [systemLogs, setSystemLogs] = useState<any[]>([]);
const [isLoadingSystemLogs, setIsLoadingSystemLogs] = useState(false);
const [systemLogsFilters, setSystemLogsFilters] = useState({
  type: '',
  user_id: null as number | null,
  start_date: '',
  end_date: ''
});
```

## Setup Instructions

### 1. Database Setup
The `activity_logs` table is already included in the main database schema. No additional setup required.

### 2. Sample Data
Run the sample data script to populate with test data:
```bash
mysql -u username -p eventra_esrs < database/sample_activity_logs.sql
```

### 3. Backend Files
Ensure these files are in place:
- `api/system-logs/get-system-logs.php`
- `services/ActivityLogger.php`

### 4. Frontend Files
Ensure these files are updated:
- `FrontEnd/src/services/api.ts` (with getSystemLogs method)
- `FrontEnd/src/pages/AdminTools.tsx` (with enhanced System Logs tab)

## Integration Points

### 1. User Authentication
Add logging to login/logout endpoints:
```php
$logger = new ActivityLogger();
$logger->logLogin($userId, $email);
```

### 2. Booking Management
Add logging to booking creation/approval endpoints:
```php
$logger = new ActivityLogger();
$logger->logBookingCreated($userId, $bookingId, $eventTitle);
```

### 3. Event Planning
Add logging to event plan endpoints:
```php
$logger = new ActivityLogger();
$logger->logEventPlanSubmitted($userId, $eventPlanId, $eventTitle);
```

### 4. User Management
Add logging to user CRUD operations:
```php
$logger = new ActivityLogger();
$logger->logUserCreated($adminUserId, $newUserId, $userEmail);
```

## Features

### 1. Real-time Updates
- Data refreshes every 30 seconds
- Manual refresh button
- Automatic refresh when filters change

### 2. Advanced Filtering
- Activity type filtering
- User-specific filtering
- Date range filtering
- Clear filters functionality

### 3. Rich Data Display
- Formatted timestamps
- User role information
- Color-coded activity types
- IP address tracking
- Detailed action descriptions

### 4. Responsive Design
- Mobile-friendly layout
- Horizontal scrolling for small screens
- Optimized table structure

## Security Considerations

### 1. Access Control
- Only Super Admin users can access system logs
- Authentication required for all API calls

### 2. Data Privacy
- IP addresses are logged for security purposes
- User agent strings are captured for debugging
- Sensitive information is not logged

### 3. Rate Limiting
- Consider implementing rate limiting for log retrieval
- Monitor for excessive API calls

## Performance Considerations

### 1. Database Indexing
- Proper indexes on frequently queried fields
- Consider partitioning for large log volumes

### 2. Caching
- Implement caching for frequently accessed logs
- Consider Redis for high-performance scenarios

### 3. Pagination
- Default limit of 100 logs per request
- Implement cursor-based pagination for large datasets

## Monitoring and Maintenance

### 1. Log Rotation
- Implement log rotation to prevent table bloat
- Archive old logs to separate tables

### 2. Performance Monitoring
- Monitor query performance
- Track API response times
- Monitor database table sizes

### 3. Error Handling
- Graceful fallback for logging failures
- Error logging for debugging

## Future Enhancements

### 1. Real-time Notifications
- WebSocket integration for live updates
- Push notifications for critical events

### 2. Advanced Analytics
- Activity trend analysis
- User behavior insights
- System performance metrics

### 3. Export Functionality
- CSV/Excel export
- PDF reports
- Scheduled report generation

## Troubleshooting

### Common Issues:

1. **No logs displayed**
   - Check database connection
   - Verify activity_logs table exists
   - Check API endpoint accessibility

2. **Filtering not working**
   - Verify filter parameters in API call
   - Check database query syntax
   - Validate date format

3. **Performance issues**
   - Check database indexes
   - Monitor query execution time
   - Consider implementing caching

### Debug Steps:
1. Check browser console for errors
2. Verify API endpoint responses
3. Check database query logs
4. Validate data format in frontend

## Support

For issues or questions regarding the System Logs functionality:
1. Check the browser console for JavaScript errors
2. Verify the backend API endpoint is accessible
3. Check database connectivity and table structure
4. Review the activity_logs table for data integrity
