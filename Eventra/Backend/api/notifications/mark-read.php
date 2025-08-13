<?php
/**
 * Notifications Mark as Read API Endpoint
 * Eventra ESRS Backend
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/Notification.php';
require_once '../../utils/JWTUtil.php';

$database = new Database();
$db = $database->getConnection();

$notification = new Notification($db);

$token = JWTUtil::getTokenFromHeader();
$payload = JWTUtil::validateToken($token);

if (!$payload) {
    http_response_code(401);
    echo json_encode(array(
        "success" => false,
        "message" => "Unauthorized access"
    ));
    exit;
}

$user_id = $payload['user_id'];

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->notification_id)) {
    
    $notification->id = $data->notification_id;
    
    if (!$notification->readOne()) {
        http_response_code(404);
        echo json_encode(array(
            "success" => false,
            "message" => "Notification not found"
        ));
        exit;
    }
    
    if ($notification->user_id != $user_id) {
        http_response_code(403);
        echo json_encode(array(
            "success" => false,
            "message" => "You can only mark your own notifications as read"
        ));
        exit;
    }
    
    if($notification->markAsRead()) {
        http_response_code(200);
        echo json_encode(array(
            "success" => true,
            "message" => "Notification marked as read"
        ));
    } else {
        http_response_code(503);
        echo json_encode(array(
            "success" => false,
            "message" => "Unable to mark notification as read"
        ));
    }
} else if(!empty($data->mark_all)) {
    if($notification->markAllAsRead($user_id)) {
        http_response_code(200);
        echo json_encode(array(
            "success" => true,
            "message" => "All notifications marked as read"
        ));
    } else {
        http_response_code(503);
        echo json_encode(array(
            "success" => false,
            "message" => "Unable to mark notifications as read"
        ));
    }
} else {
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => "Notification ID or mark_all parameter is required"
    ));
}
?> 