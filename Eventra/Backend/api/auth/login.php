<?php
/**
 * Login API Endpoint
 * Eventra ESRS Backend
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/User.php';
require_once '../../utils/JWTUtil.php';
require_once '../../services/ActivityLogger.php';

// Get database connection
$database = new Database();
$db = $database->getConnection();

// Initialize user object
$user = new User($db);

// Get posted data
$data = json_decode(file_get_contents("php://input"));

if(!empty($data->email) && !empty($data->password)) {
    
    // Set user property values
    $user->email = $data->email;
    
    // Read user by email
    if($user->readByEmail()) {
        
        // Verify password
        if(password_verify($data->password, $user->password_hash)) {
            
            // Check if user is active
            if($user->status === 'active') {
                
                // Create token payload
                $payload = array(
                    "user_id" => $user->id,
                    "email" => $user->email,
                    "name" => $user->name,
                    "role" => $user->role,
                    "exp" => time() + (24 * 60 * 60) // 24 hours
                );
                
                // Generate JWT token
                $token = JWTUtil::generateToken($payload);
                
                // Create response data
                $response_data = array(
                    "success" => true,
                    "message" => "Login successful",
                    "token" => $token,
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
                );
                
                // Log the successful login
                $logger = new ActivityLogger();
                $logger->logLogin($user->id, $user->email, $_SERVER['REMOTE_ADDR'] ?? 'unknown');
                
                // Set response code - 200 OK
                http_response_code(200);
                echo json_encode($response_data);
                
            } else {
                // Set response code - 403 Forbidden
                http_response_code(403);
                echo json_encode(array(
                    "success" => false,
                    "message" => "Account is not active. Please contact administrator."
                ));
            }
            
        } else {
            // Set response code - 401 Unauthorized
            http_response_code(401);
            echo json_encode(array(
                "success" => false,
                "message" => "Invalid credentials. Please try again."
            ));
        }
        
    } else {
        // Set response code - 401 Unauthorized
        http_response_code(401);
        echo json_encode(array(
            "success" => false,
            "message" => "Invalid credentials. Please try again."
        ));
    }
    
} else {
    // Set response code - 400 Bad request
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => "Unable to login. Data is incomplete."
    ));
}
?> 