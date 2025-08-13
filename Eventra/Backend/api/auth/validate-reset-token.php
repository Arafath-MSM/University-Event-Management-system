<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

header('Content-Type: application/json');

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(array("success" => false, "message" => "Method not allowed"));
    exit();
}

try {
    // Get token from query parameters
    $token = $_GET['token'] ?? '';

    if (empty($token)) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Reset token is required"));
        exit();
    }

    // Get database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Validate reset token
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
    
    // Check if token has expired
    if (strtotime($resetToken['expires_at']) < time()) {
        // Mark token as used since it's expired
        $updateQuery = "UPDATE password_reset_tokens SET used = 1 WHERE id = ?";
        $stmt = $db->prepare($updateQuery);
        $stmt->execute([$resetToken['id']]);
        
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Reset token has expired"));
        exit();
    }
    
    // Token is valid, return user information
    http_response_code(200);
    echo json_encode(array(
        "success" => true,
        "message" => "Reset token is valid",
        "data" => array(
            "user_id" => $resetToken['user_id'],
            "user_name" => $resetToken['name'],
            "user_email" => $resetToken['email'],
            "expires_at" => $resetToken['expires_at']
        )
    ));
    
} catch (Exception $e) {
    error_log("Token validation error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array(
        "success" => false,
        "message" => "An error occurred while validating the reset token."
    ));
}
?>
