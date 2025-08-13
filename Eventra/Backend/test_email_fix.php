<?php
echo "🧪 Testing Email Configuration Fix\n";
echo "=================================\n\n";

try {
    echo "1. Testing email.php inclusion...\n";
    require_once 'config/email.php';
    echo "✅ email.php loaded successfully\n\n";
    
    echo "2. Testing EmailService initialization...\n";
    $emailService = new EmailService();
    echo "✅ EmailService initialized successfully\n\n";
    
    echo "3. Testing PHPMailer availability...\n";
    if (class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        echo "✅ PHPMailer class found\n";
    } else {
        echo "❌ PHPMailer class not found\n";
    }
    
    echo "\n4. Testing SMTP connection...\n";
    $connectionTest = $emailService->testConnection();
    if ($connectionTest['success']) {
        echo "✅ " . $connectionTest['message'] . "\n";
    } else {
        echo "❌ " . $connectionTest['message'] . "\n";
    }
    
    echo "\n🏁 Email configuration test completed!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>
