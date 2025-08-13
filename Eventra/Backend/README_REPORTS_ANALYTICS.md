# 📊 Reports & Analytics System

## Overview

The Reports & Analytics system provides comprehensive insights into event management activities, venue utilization, user engagement, and system performance. This system is designed for Super Admins to make data-driven decisions and monitor the overall health of the Eventra ESRS platform.

## 🚀 Features

### 1. **Overview Dashboard**
- **Event Statistics**: Total events, participants, and averages
- **Status Distribution**: Breakdown of event approval statuses
- **Type Distribution**: Analysis of different event categories
- **Top Events**: Highest participant events with details

### 2. **Event Reports**
- **Detailed Event List**: Comprehensive view of all events
- **Filtering Options**: By date range, event type, venue, and status
- **Pagination**: Handle large datasets efficiently
- **Export Ready**: Data formatted for PDF/Excel export

### 3. **Venue Analytics**
- **Performance Metrics**: Utilization rates and efficiency scores
- **Top Performing Venues**: Ranked by event count and participant capacity
- **Usage Trends**: Monthly patterns and peak usage times
- **Category Analysis**: Facility-based performance breakdown

### 4. **User Analytics**
- **User Statistics**: Total, active, and new user counts
- **Role Distribution**: Breakdown by user roles
- **Activity Metrics**: Event creation and booking patterns
- **Engagement Levels**: User participation and activity scores

## 🏗️ Architecture

### Backend Components

#### API Endpoints
```
/api/reports/event-statistics.php     - Overall event statistics
/api/reports/event-reports.php        - Detailed event reports
/api/reports/venue-analytics.php      - Venue performance data
/api/reports/user-analytics.php       - User activity metrics
```

#### Database Queries
- **Complex JOINs**: Multi-table data aggregation
- **Performance Optimized**: Indexed queries for large datasets
- **Real-time Data**: Live statistics from current database state
- **Filtered Results**: Dynamic query building based on parameters

#### Security Features
- **JWT Authentication**: Secure access control
- **Role-based Access**: Super Admin only
- **Input Validation**: SQL injection prevention
- **Error Handling**: Graceful failure management

### Frontend Components

#### State Management
- **Real-time Data**: Live updates from backend APIs
- **Filter State**: Date ranges, event types, venues
- **Loading States**: User feedback during data fetching
- **Error Handling**: Retry mechanisms and user notifications

#### UI Components
- **Tabbed Interface**: Organized data presentation
- **Responsive Design**: Mobile and desktop optimized
- **Interactive Charts**: Visual data representation
- **Export Functions**: PDF and Excel generation ready

## 📊 Data Models

### Event Statistics
```json
{
  "total_events": 45,
  "total_participants": 760,
  "avg_participants": 16.9,
  "status_distribution": [
    {"status": "pending", "count": 12},
    {"status": "approved", "count": 28},
    {"status": "rejected", "count": 5}
  ],
  "type_distribution": [
    {"event_type": "Conference", "count": 15},
    {"event_type": "Cultural", "count": 20},
    {"event_type": "Sports", "count": 10}
  ]
}
```

### Venue Analytics
```json
{
  "overall_stats": {
    "total_venues": 8,
    "total_capacity": 2500
  },
  "top_performing_venues": [
    {
      "name": "Main Auditorium",
      "capacity": 500,
      "events_held": 15,
      "utilization_rate": 85.2
    }
  ]
}
```

### User Analytics
```json
{
  "overall_stats": {
    "total_users": 150,
    "active_users": 120,
    "new_users": 25
  },
  "top_active_users": [
    {
      "name": "John Doe",
      "role": "faculty",
      "events_created": 8,
      "total_participants": 320
    }
  ]
}
```

## 🔧 Setup Instructions

### 1. **Backend Setup**
```bash
# Ensure all required tables exist
- event_plans
- bookings
- venues
- users
- activity_logs (for system logs)

# Verify database permissions
- SELECT permissions on all tables
- Proper indexing on date columns
```

### 2. **Frontend Integration**
```typescript
// Import API service
import { apiService } from '../services/api';

// Fetch event statistics
const stats = await apiService.getEventStatistics({
  start_date: '2025-01-01',
  end_date: '2025-01-31',
  event_type: 'conference'
});

// Fetch venue analytics
const venues = await apiService.getVenueAnalytics({
  start_date: '2025-01-01',
  end_date: '2025-01-31'
});
```

### 3. **Testing**
```bash
# Run backend tests
cd Eventra/Backend
php test_reports.php

# Expected output:
✅ Database connection successful
✅ All required tables exist
✅ Event statistics query successful
✅ Venue analytics query successful
✅ User analytics query successful
```

## 📈 Usage Examples

### 1. **Generate Monthly Report**
1. Set date range to current month
2. Select "Overview" tab for summary
3. Use filters to focus on specific event types
4. Export data for external analysis

### 2. **Analyze Venue Performance**
1. Navigate to "Venue Analytics" tab
2. Review utilization rates and efficiency scores
3. Identify underperforming venues
4. Plan capacity optimization strategies

### 3. **Monitor User Engagement**
1. Check "User Analytics" tab
2. Review active user counts and trends
3. Identify top contributors
4. Plan user engagement initiatives

## 🎯 Performance Considerations

### Database Optimization
- **Indexed Columns**: `created_at`, `event_type`, `venue_id`
- **Query Optimization**: Efficient JOINs and aggregations
- **Pagination**: Limit result sets for large datasets
- **Caching**: Consider Redis for frequently accessed data

### Frontend Performance
- **Lazy Loading**: Load data only when tabs are active
- **Debounced Filters**: Prevent excessive API calls
- **Error Boundaries**: Graceful error handling
- **Loading States**: User feedback during operations

## 🔒 Security Features

### Authentication
- **JWT Tokens**: Secure API access
- **Role Validation**: Super Admin only access
- **Session Management**: Token expiration handling

### Data Protection
- **Input Sanitization**: Prevent SQL injection
- **Output Encoding**: XSS protection
- **Access Control**: Database-level permissions
- **Audit Logging**: Track all report access

## 🚨 Troubleshooting

### Common Issues

#### 1. **No Data Displayed**
- Check database connection
- Verify table permissions
- Review date range filters
- Check browser console for errors

#### 2. **Slow Performance**
- Review database indexes
- Check query execution plans
- Consider data pagination
- Monitor server resources

#### 3. **Authentication Errors**
- Verify JWT token validity
- Check user role permissions
- Review token expiration
- Clear browser storage if needed

### Debug Mode
```php
// Enable debug logging in API endpoints
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Check API response
var_dump($response);
```

## 🔮 Future Enhancements

### Planned Features
- **Real-time Updates**: WebSocket integration
- **Advanced Charts**: D3.js visualizations
- **Custom Reports**: User-defined report templates
- **Data Export**: CSV, JSON, and API formats
- **Scheduled Reports**: Automated report generation
- **Email Alerts**: Threshold-based notifications

### Integration Opportunities
- **Business Intelligence**: Power BI, Tableau connectors
- **Data Warehousing**: Historical data analysis
- **Machine Learning**: Predictive analytics
- **External APIs**: Third-party data sources

## 📚 API Documentation

### Event Statistics
```http
GET /api/reports/event-statistics.php
Query Parameters:
- start_date: YYYY-MM-DD
- end_date: YYYY-MM-DD
- event_type: string
- venue_id: string

Response: JSON with statistics data
```

### Event Reports
```http
GET /api/reports/event-reports.php
Query Parameters:
- start_date: YYYY-MM-DD
- end_date: YYYY-MM-DD
- event_type: string
- venue_id: string
- status: string
- limit: number
- offset: number

Response: JSON with paginated event data
```

### Venue Analytics
```http
GET /api/reports/venue-analytics.php
Query Parameters:
- start_date: YYYY-MM-DD
- end_date: YYYY-MM-DD
- venue_id: string

Response: JSON with venue performance data
```

### User Analytics
```http
GET /api/reports/user-analytics.php
Query Parameters:
- start_date: YYYY-MM-DD
- end_date: YYYY-MM-DD
- user_role: string

Response: JSON with user activity data
```

## 🏁 Conclusion

The Reports & Analytics system provides a comprehensive solution for monitoring and analyzing event management activities. With real-time data, interactive visualizations, and export capabilities, Super Admins can make informed decisions and optimize platform performance.

For support or questions, refer to the system logs or contact the development team.

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
