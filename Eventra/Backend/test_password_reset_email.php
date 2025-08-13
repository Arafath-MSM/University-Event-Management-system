<?php
/**
 * Test Password Reset Email Functionality
 * This script tests the password reset email service
 */

echo "🧪 Testing Password Reset Email Functionality\n";
echo "=============================================\n\n";

echo "1. Checking required files...\n";
$requiredFiles = [
    'config/email.php',
    'services/PasswordResetEmailService.php',
    'vendor/autoload.php'
];

foreach ($requiredFiles as $file) {
    if (file_exists($file)) {
        echo "   ✅ $file - Found\n";
    } else {
        echo "   ❌ $file - Missing\n";
    }
}

echo "\n";

echo "2. Testing email configuration...\n";
try {
    require_once 'config/email.php';
    echo "   ✅ Email configuration loaded\n";
    
    if (isset($emailService)) {
        echo "   ✅ Email service initialized\n";
        
        $connectionTest = $emailService->testConnection();
        if ($connectionTest['success']) {
            echo "   ✅ " . $connectionTest['message'] . "\n";
        } else {
            echo "   ❌ " . $connectionTest['message'] . "\n";
        }
    } else {
        echo "   ❌ Email service not available\n";
    }
    
} catch (Exception $e) {
    echo "   ❌ Error loading email configuration: " . $e->getMessage() . "\n";
}

echo "\n";

echo "3. Testing Password Reset Email Service...\n";
try {
    require_once 'services/PasswordResetEmailService.php';
    
    $passwordResetEmailService = new PasswordResetEmailService();
    echo "   ✅ Password Reset Email Service initialized\n";
    
    $connectionTest = $passwordResetEmailService->testConnection();
    if ($connectionTest['success']) {
        echo "   ✅ " . $connectionTest['message'] . "\n";
    } else {
        echo "   ❌ " . $connectionTest['message'] . "\n";
    }
    
} catch (Exception $e) {
    echo "   ❌ Error initializing Password Reset Email Service: " . $e->getMessage() . "\n";
}

echo "\n";

echo "4. Testing email templates...\n";
try {
    $passwordResetEmailService = new PasswordResetEmailService();
    
    $testToken = "test_token_123456789";
    $testLink = "http://localhost/test-reset?token=" . $testToken;
    
    $reflection = new ReflectionClass($passwordResetEmailService);
    
    $method = $reflection->getMethod('generatePasswordResetEmailBody');
    $method->setAccessible(true);
    $resetEmailBody = $method->invoke($passwordResetEmailService, 'Test User', $testLink, $testToken);
    
    if (strpos($resetEmailBody, 'Test User') !== false && strpos($resetEmailBody, $testLink) !== false) {
        echo "   ✅ Password reset email template generated successfully\n";
    } else {
        echo "   ❌ Password reset email template generation failed\n";
    }
    
    $method = $reflection->getMethod('generatePasswordResetConfirmationEmailBody');
    $method->setAccessible(true);
    $confirmationEmailBody = $method->invoke($passwordResetEmailService, 'Test User');
    
    if (strpos($confirmationEmailBody, 'Test User') !== false) {
        echo "   ✅ Password reset confirmation email template generated successfully\n";
    } else {
        echo "   ❌ Password reset confirmation email template generation failed\n";
    }
    
} catch (Exception $e) {
    echo "   ❌ Error testing email templates: " . $e->getMessage() . "\n";
}

echo "\n";

echo "5. Testing database connection...\n";
try {
    require_once 'config/database.php';
    
    $database = new Database();
    $db = $database->getConnection();
    
    if ($db) {
        echo "   ✅ Database connection successful\n";
        
        $stmt = $db->query("SHOW TABLES LIKE 'password_reset_tokens'");
        if ($stmt->rowCount() > 0) {
            echo "   ✅ password_reset_tokens table exists\n";
        } else {
            echo "   ❌ password_reset_tokens table not found\n";
        }
        
        $stmt = $db->query("SHOW TABLES LIKE 'users'");
        if ($stmt->rowCount() > 0) {
            echo "   ✅ users table exists\n";
        } else {
            echo "   ❌ users table not found\n";
        }
        
    } else {
        echo "   ❌ Database connection failed\n";
    }
    
} catch (Exception $e) {
    echo "   ❌ Error testing database connection: " . $e->getMessage() . "\n";
}

echo "\n";

echo "🏁 Testing completed!\n\n";

echo "📋 Summary:\n";
echo "===========\n";
echo "- Email Configuration: " . (isset($emailService) ? "✅ Loaded" : "❌ Failed") . "\n";
echo "- Password Reset Service: " . (class_exists('PasswordResetEmailService') ? "✅ Available" : "❌ Missing") . "\n";
echo "- Database: " . (isset($db) ? "✅ Connected" : "❌ Failed") . "\n";

echo "\n📚 Next Steps:\n";
echo "==============\n";
echo "1. Ensure your Gmail SMTP credentials are correct in config/email.php\n";
echo "2. Make sure 'Less secure app access' is enabled or use App Password\n";
echo "3. Test the forgot-password API endpoint\n";
echo "4. Check your email for password reset messages\n";
echo "5. Monitor error logs for any email delivery issues\n";

echo "\n🔧 Troubleshooting:\n";
echo "==================\n";
echo "- Check PHP error logs for detailed error messages\n";
echo "- Verify SMTP settings and credentials\n";
echo "- Ensure firewall allows outbound SMTP connections\n";
echo "- Test with a simple email first before password reset\n";

echo "\n";
?>
