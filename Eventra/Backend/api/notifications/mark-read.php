<?php
/**
 * Notifications Mark as Read API Endpoint
 * Eventra ESRS Backend
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/Notification.php';
require_once '../../utils/JWTUtil.php';

// Get database connection
$database = new Database();
$db = $database->getConnection();

// Initialize notification object
$notification = new Notification($db);

// Get user ID from token
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

// Get posted data
$data = json_decode(file_get_contents("php://input"));

if(!empty($data->notification_id)) {
    
    // Set notification ID
    $notification->id = $data->notification_id;
    
    // Check if notification exists and belongs to the user
    if (!$notification->readOne()) {
        http_response_code(404);
        echo json_encode(array(
            "success" => false,
            "message" => "Notification not found"
        ));
        exit;
    }
    
    // Check if the notification belongs to the current user
    if ($notification->user_id != $user_id) {
        http_response_code(403);
        echo json_encode(array(
            "success" => false,
            "message" => "You can only mark your own notifications as read"
        ));
        exit;
    }
    
    // Mark notification as read
    if($notification->markAsRead()) {
        // Set response code - 200 OK
        http_response_code(200);
        echo json_encode(array(
            "success" => true,
            "message" => "Notification marked as read"
        ));
    } else {
        // Set response code - 503 Service Unavailable
        http_response_code(503);
        echo json_encode(array(
            "success" => false,
            "message" => "Unable to mark notification as read"
        ));
    }
} else if(!empty($data->mark_all)) {
    // Mark all notifications as read for the user
    if($notification->markAllAsRead($user_id)) {
        // Set response code - 200 OK
        http_response_code(200);
        echo json_encode(array(
            "success" => true,
            "message" => "All notifications marked as read"
        ));
    } else {
        // Set response code - 503 Service Unavailable
        http_response_code(503);
        echo json_encode(array(
            "success" => false,
            "message" => "Unable to mark notifications as read"
        ));
    }
} else {
    // Set response code - 400 Bad request
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => "Notification ID or mark_all parameter is required"
    ));
}
?> 