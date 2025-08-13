# Email Setup for Event Management System

This document provides step-by-step instructions to set up the email functionality for sending signed letters to users.

## 🚀 Quick Setup

### 1. Install Dependencies

Navigate to the backend directory and install PHPMailer:

```bash
cd Eventra/Backend
composer install
```

### 2. Configure Email Settings

Edit `config/email.php` and update the SMTP configuration:

```php
$this->config = [
    'smtp_host' => 'smtp.gmail.com',        
    'smtp_port' => 587,                     
    'smtp_username' => 'your-email@gmail.com', 
    'smtp_password' => 'your-app-password',     
    'smtp_encryption' => 'tls',             
    'from_email' => 'noreply@university.edu', 
    'from_name' => 'University Event Management System'
];
```

### 3. Database Setup

Run the SQL script to create the email logs table:

```sql
-- Execute the contents of database/email_logs.sql
-- This creates the email_logs table for tracking sent emails
```

## 📧 Email Configuration Options

### Gmail SMTP Setup

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Use the app password** in your email config

### Other SMTP Providers

#### Outlook/Hotmail
```php
'smtp_host' => 'smtp-mail.outlook.com',
'smtp_port' => 587,
'smtp_encryption' => 'tls'
```

#### Yahoo Mail
```php
'smtp_host' => 'smtp.mail.yahoo.com',
'smtp_port' => 587,
'smtp_encryption' => 'tls'
```

#### Custom SMTP Server
```php
'smtp_host' => 'mail.yourdomain.com',
'smtp_port' => 587,
'smtp_encryption' => 'tls'
```

## 🔧 Advanced Configuration

### Environment Variables

For production, use environment variables:

```php
$this->config = [
    'smtp_host' => $_ENV['SMTP_HOST'] ?? 'smtp.gmail.com',
    'smtp_username' => $_ENV['SMTP_USERNAME'] ?? 'default@email.com',
    'smtp_password' => $_ENV['SMTP_PASSWORD'] ?? 'default-password',
    // ... other settings
];
```

### Email Templates

Customize email templates in `SignedLettersEmailService::generateEmailBody()`:

- **HTML Structure**: Modify the HTML template
- **Styling**: Update CSS classes and colors
- **Content**: Customize messages and instructions
- **Branding**: Add university logo and colors

### File Attachments

The system automatically handles file attachments:

- **Supported Formats**: PDF, DOC, DOCX, JPG, PNG
- **File Size Limit**: Configure in your SMTP settings
- **Storage**: Files are stored in the configured upload directory

## 🧪 Testing

### 1. Test Email Connection

Create a test script:

```php
<?php
require_once 'config/email.php';

$testResult = $emailService->testConnection();
var_dump($testResult);
?>
```

### 2. Mock Email Service

For development, enable mock emails:

```php
// In your config or environment
define('USE_MOCK_EMAIL', true);
```

Mock emails are logged to the error log instead of being sent.

### 3. Test API Endpoint

Test the send-signed-letters endpoint:

```bash
curl -X POST http://localhost/Eventra-ESRS/Eventra/Backend/api/event-plans/send-signed-letters.php \
  -H "Content-Type: application/json" \
  -d '{
    "eventPlanId": 1,
    "userEmail": "test@university.edu",
    "eventTitle": "Test Event",
    "requesterName": "John Doe"
  }'
```

## 📊 Monitoring & Logs

### Email Logs Table

The system logs all email activities:

```sql
SELECT * FROM email_logs 
WHERE email_type = 'signed_letters' 
ORDER BY sent_at DESC;
```

### Error Logs

Check PHP error logs for email-related issues:

```bash
tail -f /var/log/apache2/error.log
# or
tail -f /var/log/nginx/error.log
```

### Success Metrics

Monitor email delivery success:

```sql
SELECT 
    status,
    COUNT(*) as count,
    DATE(sent_at) as date
FROM email_logs 
GROUP BY status, DATE(sent_at)
ORDER BY date DESC;
```

## 🚨 Troubleshooting

### Common Issues

#### 1. SMTP Connection Failed
- Check firewall settings
- Verify SMTP credentials
- Ensure port 587/465 is open

#### 2. Authentication Failed
- Verify username/password
- Check if 2FA is enabled
- Generate new app password

#### 3. Email Not Sending
- Check error logs
- Verify file permissions
- Test SMTP connection

#### 4. Attachments Missing
- Check file paths
- Verify file permissions
- Check file size limits

### Debug Mode

Enable detailed logging:

```php
// In email.php
$this->mailer->SMTPDebug = SMTP::DEBUG_SERVER;
$this->mailer->Debugoutput = 'error_log';
```

## 🔒 Security Considerations

### 1. SMTP Credentials
- Store credentials securely (environment variables)
- Use app passwords, not main passwords
- Rotate credentials regularly

### 2. File Uploads
- Validate file types and sizes
- Scan for malware
- Store files outside web root

### 3. Rate Limiting
- Implement email rate limiting
- Prevent spam/abuse
- Monitor email volume

### 4. Data Privacy
- Encrypt sensitive data
- Comply with GDPR/privacy laws
- Audit email logs regularly

## 📈 Performance Optimization

### 1. Email Queuing
For high-volume systems, implement email queuing:

```php
// Queue emails instead of sending immediately
$emailQueue->add([
    'to' => $userEmail,
    'subject' => $subject,
    'body' => $body,
    'attachments' => $attachments
]);
```

### 2. Batch Processing
Send multiple emails in batches:

```php
// Process multiple emails at once
$emailService->sendBatchEmails($emailBatch);
```

### 3. Caching
Cache email templates and configurations:

```php
// Cache email templates
$template = $cache->get('email_template_' . $templateId);
```

## 🎯 Production Checklist

- [ ] SMTP credentials configured
- [ ] Email templates customized
- [ ] File uploads secured
- [ ] Error logging enabled
- [ ] Monitoring setup
- [ ] Rate limiting configured
- [ ] Security measures implemented
- [ ] Backup procedures in place
- [ ] Testing completed
- [ ] Documentation updated

## 📞 Support

For technical support:

1. Check error logs first
2. Verify configuration settings
3. Test SMTP connection
4. Review this documentation
5. Contact system administrator

## 📝 Changelog

### Version 1.0.0
- Initial email functionality
- PHPMailer integration
- Signed letters email service
- Email logging system
- Professional email templates
