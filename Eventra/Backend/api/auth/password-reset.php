<?php
/**
 * Password Reset API Endpoint
 * Eventra ESRS Backend
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/User.php';

// Get database connection
$database = new Database();
$db = $database->getConnection();

// Initialize user object
$user = new User($db);

// Get posted data
$data = json_decode(file_get_contents("php://input"));

if(!empty($data->email)) {
    
    // Set user property values
    $user->email = $data->email;
    
    // Read user by email
    if($user->readByEmail()) {
        
        // Generate reset token
        $token = bin2hex(random_bytes(32));
        $expires_at = date('Y-m-d H:i:s', strtotime('+1 hour'));
        
        // Store reset token in database
        $query = "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)";
        $stmt = $db->prepare($query);
        
        if($stmt->execute([$user->id, $token, $expires_at])) {
            
            // In a real application, you would send an email here
            // For demo purposes, we'll just return the token
            
            $response_data = array(
                "success" => true,
                "message" => "Password reset token generated successfully",
                "token" => $token, // In production, this should be sent via email
                "expires_at" => $expires_at
            );
            
            // Set response code - 200 OK
            http_response_code(200);
            echo json_encode($response_data);
            
        } else {
            // Set response code - 503 Service unavailable
            http_response_code(503);
            echo json_encode(array(
                "success" => false,
                "message" => "Unable to generate reset token."
            ));
        }
        
    } else {
        // Set response code - 404 Not found
        http_response_code(404);
        echo json_encode(array(
            "success" => false,
            "message" => "User not found."
        ));
    }
    
} else {
    // Set response code - 400 Bad request
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => "Email is required."
    ));
}
?> 