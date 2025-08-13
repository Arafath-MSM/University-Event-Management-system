<?php
/**
 * Token Verification API Endpoint
 * Eventra ESRS Backend
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/User.php';
require_once '../../utils/JWTUtil.php';

// Get database connection
$database = new Database();
$db = $database->getConnection();

// Initialize user object
$user = new User($db);

// Get token from Authorization header
$token = JWTUtil::getTokenFromHeader();

if($token) {
    // Validate token
    $payload = JWTUtil::validateToken($token);
    
    if($payload) {
        // Token is valid, get user data
        $user->id = $payload['user_id'];
        
        if($user->readOne()) {
            // Check if user is still active
            if($user->status === 'active') {
                // Set response code - 200 OK
                http_response_code(200);
                echo json_encode(array(
                    "success" => true,
                    "message" => "Token is valid",
                    "user" => array(
                        "id" => $user->id,
                        "name" => $user->name,
                        "email" => $user->email,
                        "role" => $user->role,
                        "department" => $user->department,
                        "faculty" => $user->faculty,
                        "designation" => $user->designation,
                        "bio" => $user->bio,
                        "event_interests" => $user->event_interests,
                        "service_type" => $user->service_type,
                        "status" => $user->status,
                        "is_email_verified" => $user->is_email_verified
                    )
                ));
            } else {
                // Set response code - 403 Forbidden
                http_response_code(403);
                echo json_encode(array(
                    "success" => false,
                    "message" => "Account is not active"
                ));
            }
        } else {
            // Set response code - 404 Not found
            http_response_code(404);
            echo json_encode(array(
                "success" => false,
                "message" => "User not found"
            ));
        }
    } else {
        // Set response code - 401 Unauthorized
        http_response_code(401);
        echo json_encode(array(
            "success" => false,
            "message" => "Invalid token"
        ));
    }
} else {
    // Set response code - 401 Unauthorized
    http_response_code(401);
    echo json_encode(array(
        "success" => false,
        "message" => "No token provided"
    ));
}
?> 