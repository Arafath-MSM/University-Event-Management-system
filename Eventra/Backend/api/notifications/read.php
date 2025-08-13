<?php
/**
 * Notifications Read API Endpoint
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

// Get query parameters
$status = $_GET['status'] ?? null;
$type = $_GET['type'] ?? null;
$limit = $_GET['limit'] ?? null;

// Debug: Log the user_id and status being used
error_log("Notifications API - User ID: " . $user_id . ", Status: " . ($status ?? 'null'));

try {
    // Read notifications for the user
    $stmt = $notification->read($user_id, $status, $type, $limit);
    $notifications = [];
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $notifications[] = array(
            "id" => $row['id'],
            "title" => $row['title'],
            "message" => $row['message'],
            "type" => $row['type'],
            "status" => $row['status'],
            "related_booking_id" => $row['related_booking_id'],
            "related_venue_id" => $row['related_venue_id'],
            "booking_title" => $row['booking_title'],
            "venue_name" => $row['venue_name'],
            "metadata" => $row['metadata'] ? json_decode($row['metadata'], true) : null,
            "created_at" => $row['created_at'],
            "updated_at" => $row['updated_at']
        );
    }
    
    // Set response code - 200 OK
    http_response_code(200);
    echo json_encode(array(
        "success" => true,
        "message" => "Notifications retrieved successfully",
        "data" => $notifications
    ));
    
} catch (Exception $e) {
    // Set response code - 500 Internal Server Error
    http_response_code(500);
    echo json_encode(array(
        "success" => false,
        "message" => "Unable to retrieve notifications: " . $e->getMessage()
    ));
}
?> 