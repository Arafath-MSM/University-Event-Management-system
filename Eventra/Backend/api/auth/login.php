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

$database = new Database();
$db = $database->getConnection();

$user = new User($db);

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->email) && !empty($data->password)) {
    
    $user->email = $data->email;
    
    if($user->readByEmail()) {
        
        if(password_verify($data->password, $user->password_hash)) {
            
            if($user->status === 'active') {
                
                $payload = array(
                    "user_id" => $user->id,
                    "email" => $user->email,
                    "name" => $user->name,
                    "role" => $user->role,
                    "exp" => time() + (24 * 60 * 60) // 24 hours
                );
                
                $token = JWTUtil::generateToken($payload);
                
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
                
                $logger = new ActivityLogger();
                $logger->logLogin($user->id, $user->email, $_SERVER['REMOTE_ADDR'] ?? 'unknown');
                
                http_response_code(200);
                echo json_encode($response_data);
                
            } else {
                http_response_code(403);
                echo json_encode(array(
                    "success" => false,
                    "message" => "Account is not active. Please contact administrator."
                ));
            }
            
        } else {
            http_response_code(401);
            echo json_encode(array(
                "success" => false,
                "message" => "Invalid credentials. Please try again."
            ));
        }
        
    } else {
        http_response_code(401);
        echo json_encode(array(
            "success" => false,
            "message" => "Invalid credentials. Please try again."
        ));
    }
    
} else {
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => "Unable to login. Data is incomplete."
    ));
}
?> 