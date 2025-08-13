# Password Reset Email Functionality

This document explains how the password reset email functionality works in the Event Management System.

## 🚀 Overview

The system now sends real emails for password reset requests and confirmations using PHPMailer with Gmail SMTP. Users will receive professional-looking HTML emails with reset links and confirmation messages.

## 📧 Email Flow

### 1. Password Reset Request
1. User enters email in "Forgot Password" form
2. System generates a secure reset token
3. Token is stored in database with 1-hour expiry
4. Professional HTML email is sent with reset link
5. User clicks link to access password reset form

### 2. Password Reset Confirmation
1. User submits new password
2. System validates token and updates password
3. Token is marked as used
4. Confirmation email is sent to user
5. User can now login with new password

## 🔧 Configuration

### SMTP Settings (config/email.php)
```php
'smtp_host' => 'smtp.gmail.com',
'smtp_port' => 587,
'smtp_username' => 'your-email@gmail.com',
'smtp_password' => 'your-app-password',
'smtp_encryption' => 'tls',
'from_email' => 'noreply@university.edu',
'from_name' => 'University Event Management System'
```

### Gmail Setup
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Use App Password** instead of regular password in config

## 📁 Files Structure

```
Eventra/Backend/
├── config/
│   └── email.php                    # Email configuration
├── services/
│   └── PasswordResetEmailService.php # Password reset email service
├── api/auth/
│   ├── forgot-password.php          # Request password reset
│   ├── validate-reset-token.php     # Validate reset token
│   └── reset-password.php           # Reset password
└── test_password_reset_email.php    # Test script
```

## 🎨 Email Templates

### Password Reset Request Email
- Professional HTML design with university branding
- Clear reset button and manual link
- Security warnings and expiry information
- Responsive design for mobile devices

### Password Reset Confirmation Email
- Success confirmation message
- Next steps for user
- Security reminders
- Professional university branding

## 🧪 Testing

### Run Test Script
```bash
cd Eventra/Backend
php test_password_reset_email.php
```

### Test API Endpoints
1. **Request Reset**: `POST /api/auth/forgot-password.php`
2. **Validate Token**: `GET /api/auth/validate-reset-token.php?token=...`
3. **Reset Password**: `POST /api/auth/reset-password.php`

### Test Email Delivery
1. Use a real email address
2. Check spam/junk folders
3. Monitor PHP error logs
4. Verify SMTP connection

## 🔒 Security Features

- **Secure Tokens**: 32-byte random tokens
- **Time Expiry**: Tokens expire in 1 hour
- **Single Use**: Tokens can only be used once
- **Rate Limiting**: Database prevents multiple active tokens
- **Secure Links**: HTTPS reset links with tokens
- **Activity Logging**: All reset attempts are logged

## 📊 Database Schema

### password_reset_tokens Table
```sql
CREATE TABLE password_reset_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used TINYINT(1) DEFAULT 0,
    used_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🚨 Troubleshooting

### Common Issues

1. **SMTP Connection Failed**
   - Check Gmail credentials
   - Verify App Password is correct
   - Ensure 2FA is enabled
   - Check firewall settings

2. **Emails Not Received**
   - Check spam/junk folders
   - Verify email address is correct
   - Check PHP error logs
   - Test SMTP connection

3. **Token Validation Errors**
   - Check database connection
   - Verify table structure
   - Check token expiry logic
   - Monitor activity logs

### Debug Steps

1. **Check PHP Error Logs**
   ```bash
   tail -f /var/log/php_errors.log
   ```

2. **Test SMTP Connection**
   ```bash
   php test_password_reset_email.php
   ```

3. **Verify Database**
   ```sql
   SELECT * FROM password_reset_tokens ORDER BY created_at DESC LIMIT 5;
   ```

4. **Check Email Service**
   ```php
   $emailService = new EmailService();
   $result = $emailService->testConnection();
   var_dump($result);
   ```

## 📈 Monitoring

### Log Files to Monitor
- PHP error logs
- Email service logs
- Database query logs
- Activity logs

### Key Metrics
- Password reset requests per day
- Email delivery success rate
- Token usage patterns
- Failed reset attempts

## 🔄 Future Enhancements

1. **Email Templates**
   - Multiple language support
   - Customizable branding
   - A/B testing for templates

2. **Security Improvements**
   - IP-based rate limiting
   - Device fingerprinting
   - Advanced fraud detection

3. **User Experience**
   - Password strength indicators
   - Progressive password requirements
   - Social login integration

## 📞 Support

For issues with password reset functionality:

1. Check this documentation
2. Run the test script
3. Review error logs
4. Contact system administrator

## 📝 Changelog

- **v1.0.0**: Initial implementation with Gmail SMTP
- **v1.1.0**: Added professional HTML email templates
- **v1.2.0**: Enhanced security and logging features
- **v1.3.0**: Added comprehensive testing and monitoring

---

**Note**: This system is designed for production use with proper security measures. Always test thoroughly in a development environment before deploying to production.
