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
    
    if (!isset($input['token']) || empty($input['token'])) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Reset token is required"));
        exit();
    }
    
    if (!isset($input['password']) || empty($input['password'])) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "New password is required"));
        exit();
    }
    
    if (!isset($input['confirm_password']) || empty($input['confirm_password'])) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Password confirmation is required"));
        exit();
    }
    
    $token = trim($input['token']);
    $password = $input['password'];
    $confirmPassword = $input['confirm_password'];
    
    if (strlen($password) < 8) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Password must be at least 8 characters long"));
        exit();
    }
    
    if ($password !== $confirmPassword) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Passwords do not match"));
        exit();
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    $tokenQuery = "
        SELECT 
            prt.id,
            prt.user_id,
            prt.token,
            prt.expires_at,
            prt.used,
            u.name,
            u.email
        FROM password_reset_tokens prt
        JOIN users u ON prt.user_id = u.id
        WHERE prt.token = ? AND prt.used = 0
    ";
    
    $stmt = $db->prepare($tokenQuery);
    $stmt->execute([$token]);
    $resetToken = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$resetToken) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Invalid or expired reset token"));
        exit();
    }
    
    if (strtotime($resetToken['expires_at']) < time()) {
        $updateQuery = "UPDATE password_reset_tokens SET used = 1 WHERE id = ?";
        $stmt = $db->prepare($updateQuery);
        $stmt->execute([$resetToken['id']]);
        
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Reset token has expired"));
        exit();
    }
    
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    $updatePasswordQuery = "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?";
    $stmt = $db->prepare($updatePasswordQuery);
    $stmt->execute([$hashedPassword, $resetToken['user_id']]);
    
    $updateTokenQuery = "UPDATE password_reset_tokens SET used = 1, used_at = NOW() WHERE id = ?";
    $stmt = $db->prepare($updateTokenQuery);
    $stmt->execute([$resetToken['id']]);
    
    try {
        $logQuery = "INSERT INTO activity_logs (user_id, action, details, type, target_id, target_type, ip_address, user_agent, created_at) VALUES (?, 'password_reset_completed', 'Password reset completed for user: ?', 'user', ?, 'user', ?, ?, NOW())";
        $stmt = $db->prepare($logQuery);
        $stmt->execute([
            $resetToken['user_id'], 
            $resetToken['email'], 
            $resetToken['user_id'], 
            $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]);
    } catch (Exception $logError) {
        error_log("Failed to log password reset completion: " . $logError->getMessage());
    }
    
    $emailService = new PasswordResetEmailService();
    $emailSent = $emailService->sendPasswordResetConfirmationEmail($resetToken['email'], $resetToken['name']);
    
    if (!$emailSent) {
        error_log("Failed to send password reset confirmation email to: " . $resetToken['email']);
    }
    
    http_response_code(200);
    echo json_encode(array(
        "success" => true,
        "message" => "Password has been reset successfully. You can now login with your new password."
    ));
    
} catch (Exception $e) {
    error_log("Password reset error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array(
        "success" => false,
        "message" => "An error occurred while resetting your password."
    ));
}
?> 