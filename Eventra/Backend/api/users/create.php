<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/User.php';
require_once '../../utils/JWTUtil.php';
require_once '../../services/ActivityLogger.php';

header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();

$user = new User($db);

$token = JWTUtil::getTokenFromHeader();
$payload = JWTUtil::validateToken($token);

if (!$payload) {
    http_response_code(401);
    echo json_encode(array("success" => false, "message" => "Unauthorized"));
    exit();
}

if ($payload['role'] !== 'super-admin') {
    http_response_code(403);
    echo json_encode(array("success" => false, "message" => "Access denied. Only super-admin can create users."));
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->name) && !empty($data->email) && !empty($data->role)) {
    
    $user->email = $data->email;
    if ($user->readByEmail()) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Email already exists"));
        exit();
    }
    
    $user->name = $data->name;
    $user->email = $data->email;
    $user->role = $data->role;
    $user->status = $data->status ?? 'active';
    $user->password_hash = password_hash($data->password ?? 'default123', PASSWORD_DEFAULT);
    $user->is_email_verified = false;
    
    if ($user->create()) {
        $logger = new ActivityLogger();
        $logger->logUserCreated($payload['user_id'], $user->id, $data->email, $_SERVER['REMOTE_ADDR'] ?? 'unknown');
        
        http_response_code(201);
        echo json_encode(array(
            "success" => true,
            "message" => "User created successfully",
            "user" => array(
                "id" => $user->id,
                "name" => $user->name,
                "email" => $user->email,
                "role" => $user->role,
                "status" => $user->status
            )
        ));
    } else {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Unable to create user"));
    }
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Missing required fields"));
}
?>
