<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/Booking.php';
require_once '../../models/Notification.php';
require_once '../../models/User.php';
require_once '../../utils/JWTUtil.php';
require_once '../../services/ActivityLogger.php';

header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();
$booking = new Booking($db);
$notification = new Notification($db);

$token = JWTUtil::getTokenFromHeader();
$payload = JWTUtil::validateToken($token);

if (!$payload) {
    http_response_code(401);
    echo json_encode(array("success" => false, "message" => "Unauthorized"));
    exit();
}

if ($payload['role'] !== 'super-admin') {
    http_response_code(403);
    echo json_encode(array("success" => false, "message" => "Access denied. Only super-admin can approve bookings."));
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->booking_id) && !empty($data->action)) {
    $booking->id = $data->booking_id;
    
    if (!$booking->readOne()) {
        http_response_code(404);
        echo json_encode(array("success" => false, "message" => "Booking not found"));
        exit();
    }
    
    if ($booking->status !== 'pending') {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Booking is not in pending status"));
        exit();
    }
    
    $new_status = ($data->action === 'approve') ? 'approved' : 'rejected';
    $booking->status = $new_status;
    
    if ($booking->update()) {
        if ($payload['user_id'] == $booking->user_id) {
            $notification->createBookingStatusNotification(
                $booking->user_id,
                $booking->id,
                $booking->venue_id,
                $booking->event_title,
                $new_status
            );
        } else {
            $notification->createBookingStatusNotification(
                $booking->user_id,
                $booking->id,
                $booking->venue_id,
                $booking->event_title,
                $new_status
            );
            
            $notification->createAdminNotification(
                $payload['user_id'],
                "Booking " . ucfirst($new_status),
                "You have successfully " . $new_status . " the booking request for '{$booking->event_title}' by user ID {$booking->user_id}.",
                'booking_action_confirmation'
            );
        }
        
        $logger = new ActivityLogger();
        if ($data->action === 'approve') {
            $logger->logBookingApproved($payload['user_id'], $booking->id, $booking->event_title, $_SERVER['REMOTE_ADDR'] ?? 'unknown');
        } else {
            $logger->logBookingRejected($payload['user_id'], $booking->id, $booking->event_title, $_SERVER['REMOTE_ADDR'] ?? 'unknown');
        }
        
        http_response_code(200);
        echo json_encode(array(
            "success" => true, 
            "message" => "Booking " . $new_status . " successfully"
        ));
    } else {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Failed to update booking status"));
    }
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Missing required fields"));
}
?> 