<?php
/**
 * Token Verification API Endpoint
 * Eventra ESRS Backend
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/User.php';
require_once '../../utils/JWTUtil.php';

$database = new Database();
$db = $database->getConnection();

$user = new User($db);

$token = JWTUtil::getTokenFromHeader();

if($token) {
    $payload = JWTUtil::validateToken($token);
    
    if($payload) {
        $user->id = $payload['user_id'];
        
        if($user->readOne()) {
            if($user->status === 'active') {
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
                http_response_code(403);
                echo json_encode(array(
                    "success" => false,
                    "message" => "Account is not active"
                ));
            }
        } else {
            http_response_code(404);
            echo json_encode(array(
                "success" => false,
                "message" => "User not found"
            ));
        }
    } else {
        http_response_code(401);
        echo json_encode(array(
            "success" => false,
            "message" => "Invalid token"
        ));
    }
} else {
    http_response_code(401);
    echo json_encode(array(
        "success" => false,
        "message" => "No token provided"
    ));
}
?> 