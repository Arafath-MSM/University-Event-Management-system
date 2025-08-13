<?php
/**
 * Register API Endpoint
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

// Get posted data
$data = json_decode(file_get_contents("php://input"));

if(!empty($data->name) && !empty($data->email) && !empty($data->password) && !empty($data->role)) {
    
    // Check if role is allowed for public registration
    $public_roles = ['student', 'faculty'];
    if(!in_array($data->role, $public_roles)) {
        http_response_code(403);
        echo json_encode(array(
            "success" => false,
            "message" => "This role cannot be registered publicly. Please contact your administrator."
        ));
        exit();
    }
    
    // Set user property values
    $user->name = $data->name;
    $user->email = $data->email;
    $user->password_hash = password_hash($data->password, PASSWORD_DEFAULT);
    $user->role = $data->role;
    $user->department = $data->department ?? null;
    $user->faculty = $data->faculty ?? null;
    $user->designation = $data->designation ?? null;
    $user->bio = $data->bio ?? null;
    $user->event_interests = $data->event_interests ?? null;
    $user->service_type = null; // Only for service-provider
    $user->status = 'active';
    $user->is_email_verified = false;
    
    // Check if email already exists
    if($user->emailExists()) {
        http_response_code(409);
        echo json_encode(array(
            "success" => false,
            "message" => "An account with this email already exists."
        ));
        exit();
    }
    
    // Create the user
    if($user_id = $user->create()) {
        
        // Get the created user data
        $user->id = $user_id;
        $user->readOne();
        
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
            "message" => "User registered successfully",
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
        
        // Set response code - 201 Created
        http_response_code(201);
        echo json_encode($response_data);
        
    } else {
        // Set response code - 503 Service unavailable
        http_response_code(503);
        echo json_encode(array(
            "success" => false,
            "message" => "Unable to register user."
        ));
    }
    
} else {
    // Set response code - 400 Bad request
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => "Unable to register user. Data is incomplete."
    ));
}
?> 