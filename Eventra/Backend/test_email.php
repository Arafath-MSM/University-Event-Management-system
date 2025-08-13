<?php
/**
 * Email Functionality Test Script
 * 
 * This script tests the email service to ensure it's working correctly.
 * Run this script to verify your email configuration.
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "🧪 Testing Email Functionality\n";
echo "==============================\n\n";

try {
    echo "1. Checking email configuration...\n";
    if (!file_exists('config/email.php')) {
        throw new Exception("Email configuration file not found. Please create config/email.php");
    }
    echo "✅ Email configuration file found\n\n";
    
    echo "2. Testing email service initialization...\n";
    require_once 'config/email.php';
    echo "✅ Email service initialized\n\n";
    
    echo "3. Testing SMTP connection...\n";
    $connectionTest = $emailService->testConnection();
    
    if ($connectionTest['success']) {
        echo "✅ SMTP connection successful\n";
        echo "   Message: {$connectionTest['message']}\n\n";
    } else {
        echo "⚠️  SMTP connection failed\n";
        echo "   Message: {$connectionTest['message']}\n";
        echo "   This might be due to incorrect credentials or network issues\n\n";
    }
    
    if ($connectionTest['success']) {
        echo "4. Testing simple email sending...\n";
        
        $testEmail = 'msmarafath02@gmail.com'; 
        $testSubject = 'Event Management System - Test Email';
        $testBody = "
        <html>
        <body>
            <h2>🧪 Test Email</h2>
            <p>This is a test email from the Event Management System.</p>
            <p><strong>Time:</strong> " . date('Y-m-d H:i:s') . "</p>
            <p><strong>Status:</strong> Email service is working correctly!</p>
            <hr>
            <p><em>This is an automated test email. Please ignore.</em></p>
        </body>
        </html>";
        
        $emailResult = $emailService->sendSimpleEmail($testEmail, $testSubject, $testBody);
        
        if ($emailResult['success']) {
            echo "✅ Test email sent successfully\n";
            echo "   Recipient: {$emailResult['recipient']}\n";
            echo "   Subject: {$emailResult['subject']}\n";
            if (isset($emailResult['mock']) && $emailResult['mock']) {
                echo "   Note: This was a mock email (logged to error log)\n";
            }
        } else {
            echo "❌ Test email failed\n";
            echo "   Error: {$emailResult['message']}\n";
        }
        echo "\n";
    }
    
    echo "5. Testing signed letters API endpoint...\n";
    if (file_exists('api/event-plans/send-signed-letters.php')) {
        echo "✅ Signed letters API endpoint found\n";
    } else {
        echo "❌ Signed letters API endpoint not found\n";
    }
    
    echo "6. Checking database setup...\n";
    if (file_exists('database/email_logs.sql')) {
        echo "✅ Email logs SQL script found\n";
        echo "   Run this script to create the email_logs table\n";
    } else {
        echo "❌ Email logs SQL script not found\n";
    }
    
    echo "\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "🏁 Testing completed!\n\n";

echo "📋 Configuration Summary\n";
echo "=======================\n";
echo "Email Config File: " . (file_exists('config/email.php') ? '✅ Found' : '❌ Missing') . "\n";
echo "API Endpoint: " . (file_exists('api/event-plans/send-signed-letters.php') ? '✅ Found' : '❌ Missing') . "\n";
echo "Database Script: " . (file_exists('database/email_logs.sql') ? '✅ Found' : '❌ Missing') . "\n";
echo "Composer File: " . (file_exists('composer.json') ? '✅ Found' : '❌ Missing') . "\n";

echo "\n📚 Next Steps:\n";
echo "1. Configure SMTP settings in config/email.php\n";
echo "2. Run 'composer install' to install PHPMailer\n";
echo "3. Execute database/email_logs.sql to create the email logs table\n";
echo "4. Test with a real email address\n";
echo "5. Check error logs if issues occur\n";

echo "\n🔧 For development, you can enable mock emails:\n";
echo "   define('USE_MOCK_EMAIL', true);\n";
echo "   This will log emails instead of sending them.\n";
?>
