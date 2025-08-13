<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../services/PasswordResetEmailService.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array("success" => false, "message" => "Method not allowed"));
    exit();
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['email']) || empty($input['email'])) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Email is required"));
        exit();
    }
    
    $email = trim($input['email']);
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Invalid email format"));
        exit();
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    $userQuery = "SELECT id, name, email, role FROM users WHERE email = ? AND status = 'active'";
    $stmt = $db->prepare($userQuery);
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(200);
        echo json_encode(array(
            "success" => true, 
            "message" => "If an account with that email exists, a password reset link has been sent."
        ));
        exit();
    }
    
    $resetToken = bin2hex(random_bytes(32));
    $tokenExpiry = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    $tokenQuery = "INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at) VALUES (?, ?, ?, NOW())";
    $stmt = $db->prepare($tokenQuery);
    $stmt->execute([$user['id'], $resetToken, $tokenExpiry]);
    
    $resetLink = "http://localhost:8080/reset-password?token=" . $resetToken;
    
    $emailService = new PasswordResetEmailService();
    $emailSent = $emailService->sendPasswordResetEmail($user['email'], $user['name'], $resetToken, $resetLink);
    
    if ($emailSent) {
        try {
            $logQuery = "INSERT INTO activity_logs (user_id, action, details, type, target_id, target_type, ip_address, user_agent, created_at) VALUES (?, 'password_reset_requested', 'Password reset requested for user: ?', 'user', ?, 'user', ?, ?, NOW())";
            $stmt = $db->prepare($logQuery);
            $stmt->execute([
                $user['id'], 
                $user['email'], 
                $user['id'], 
                $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
            ]);
        } catch (Exception $logError) {
            error_log("Failed to log password reset request: " . $logError->getMessage());
        }
        
        if (defined('USE_MOCK_EMAIL') && USE_MOCK_EMAIL) {
            error_log("=== PASSWORD RESET TOKEN FOR TESTING ===");
            error_log("User: " . $user['email']);
            error_log("Reset Token: " . $resetToken);
            error_log("Reset Link: " . $resetLink);
            error_log("========================================");
            
            http_response_code(200);
            echo json_encode(array(
                "success" => true,
                "message" => "Password reset link has been generated successfully. (Mock Email Service - Check server logs for reset link)",
                "debug_info" => array(
                    "reset_token" => $resetToken,
                    "reset_link" => $resetLink,
                    "note" => "This is using mock email service. In production with PHPMailer, this would be sent via email. Check server logs for the reset link."
                )
            ));
        } else {
            http_response_code(200);
            echo json_encode(array(
                "success" => true,
                "message" => "Password reset link has been sent to your email address."
            ));
        }
    } else {
        $deleteQuery = "DELETE FROM password_reset_tokens WHERE user_id = ? AND token = ?";
        $stmt = $db->prepare($deleteQuery);
        $stmt->execute([$user['id'], $resetToken]);
        
        http_response_code(500);
        echo json_encode(array(
            "success" => false,
            "message" => "Failed to send password reset email. Please try again later."
        ));
    }
    
} catch (Exception $e) {
    error_log("Password reset error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array(
        "success" => false,
        "message" => "An error occurred while processing your request."
    ));
}
?>
