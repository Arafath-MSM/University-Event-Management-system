<?php
/**
 * Password Reset API Endpoint
 * Eventra ESRS Backend
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/User.php';

$database = new Database();
$db = $database->getConnection();

$user = new User($db);

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->email)) {
    
    $user->email = $data->email;
    
    if($user->readByEmail()) {
        
        $token = bin2hex(random_bytes(32));
        $expires_at = date('Y-m-d H:i:s', strtotime('+1 hour'));
        
        $query = "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)";
        $stmt = $db->prepare($query);
        
        if($stmt->execute([$user->id, $token, $expires_at])) {
            
            $response_data = array(
                "success" => true,
                "message" => "Password reset token generated successfully",
                "token" => $token, // In production, this should be sent via email
                "expires_at" => $expires_at
            );
            
            http_response_code(200);
            echo json_encode($response_data);
            
        } else {
            http_response_code(503);
            echo json_encode(array(
                "success" => false,
                "message" => "Unable to generate reset token."
            ));
        }
        
    } else {
        http_response_code(404);
        echo json_encode(array(
            "success" => false,
            "message" => "User not found."
        ));
    }
    
} else {
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => "Email is required."
    ));
}
?> 