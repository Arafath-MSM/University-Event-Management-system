# Setting Up Composer and PHPMailer for Email Functionality

## 🚨 Current Status
The system is currently using a **Mock Email Service** because PHPMailer dependencies are not installed. This means:
- ✅ Password reset tokens are generated and stored
- ✅ Database operations work correctly
- ❌ Actual emails are not sent (only logged to server)
- ❌ Users won't receive password reset emails

## 🔧 To Enable Real Email Functionality

### Step 1: Install Composer
1. **Download Composer**:
   - Go to: https://getcomposer.org/download/
   - Download `composer-setup.php` for Windows
   - Run: `php composer-setup.php`

2. **Verify Installation**:
   ```bash
   composer --version
   ```

### Step 2: Install PHPMailer Dependencies
1. **Navigate to Backend Directory**:
   ```bash
   cd Eventra/Backend
   ```

2. **Install Dependencies**:
   ```bash
   composer install
   ```

3. **Verify Installation**:
   ```bash
   ls vendor/
   # Should show: autoload.php, phpmailer/, etc.
   ```

### Step 3: Enable Real Email Service
1. **Edit `config/email.php`**:
   ```php
   define('USE_MOCK_EMAIL', false);
   ```

2. **Uncomment PHPMailer imports**:
   ```php
   use PHPMailer\PHPMailer\PHPMailer;
   use PHPMailer\PHPMailer\SMTP;
   use PHPMailer\PHPMailer\Exception;
   
   require_once 'vendor/autoload.php';
   ```

### Step 4: Test Email Functionality
1. **Run Test Script**:
   ```bash
   php test_password_reset_email.php
   ```

2. **Test Password Reset**:
   - Go to "Forgot Password" page
   - Enter your email
   - Check your email for reset link

## 📧 Gmail SMTP Configuration

Your Gmail settings are already configured in `config/email.php`:
- **SMTP Host**: `smtp.gmail.com`
- **Port**: `587` (TLS)
- **Username**: `msmarafath1@gmail.com`
- **App Password**: `uepo crop bvfb pxke`

## 🔍 Troubleshooting

### If Composer Installation Fails:
1. **Check PHP Version**: Ensure PHP 7.4+ is installed
2. **Check PHP Extensions**: Ensure `php_openssl` and `php_zip` are enabled
3. **Check WAMP Configuration**: Ensure WAMP is properly configured

### If PHPMailer Installation Fails:
1. **Check Internet Connection**: Composer needs internet to download packages
2. **Check Firewall**: Ensure outbound connections are allowed
3. **Check Disk Space**: Ensure sufficient disk space for packages

### If Email Still Doesn't Work:
1. **Check Gmail Settings**:
   - 2-Factor Authentication enabled
   - App Password generated correctly
   - Less secure app access (if not using App Password)

2. **Check Server Logs**:
   - PHP error logs
   - Email service logs
   - SMTP connection logs

## 📋 Current Mock Service Behavior

While using mock email service:
- Password reset tokens are generated and stored in database
- Reset links are logged to server error logs
- Users get success message but no actual email
- You can manually check server logs for reset links

## 🚀 Quick Test

To test the current mock service:
1. Go to "Forgot Password" page
2. Enter your email: `msmarafath02@gmail.com`
3. Click "Send Reset Link"
4. Check server logs for the reset token and link
5. Use the link manually to test the reset flow

## 📞 Next Steps

1. **Install Composer** (if not already installed)
2. **Run `composer install`** in the Backend directory
3. **Change `USE_MOCK_EMAIL` to `false`** in `config/email.php`
4. **Test real email functionality**
5. **Monitor email delivery**

---

**Note**: The mock service is a temporary solution for development. For production use, you must install PHPMailer and enable real email sending.
