<?php
/**
 * Notifications Read API Endpoint
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

$status = $_GET['status'] ?? null;
$type = $_GET['type'] ?? null;
$limit = $_GET['limit'] ?? null;

error_log("Notifications API - User ID: " . $user_id . ", Status: " . ($status ?? 'null'));

try {
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
    
    http_response_code(200);
    echo json_encode(array(
        "success" => true,
        "message" => "Notifications retrieved successfully",
        "data" => $notifications
    ));
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "success" => false,
        "message" => "Unable to retrieve notifications: " . $e->getMessage()
    ));
}
?> 