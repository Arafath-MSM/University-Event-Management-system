<?php
/**
 * Booking Cancel API Endpoint
 * Eventra ESRS Backend
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/Booking.php';
require_once '../../utils/JWTUtil.php';

$database = new Database();
$db = $database->getConnection();

$booking = new Booking($db);

$data = json_decode(file_get_contents("php://input"));

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

if(!empty($data->booking_id)) {
    
    $booking->id = $data->booking_id;
    
    if (!$booking->readOne()) {
        http_response_code(404);
        echo json_encode(array(
            "success" => false,
            "message" => "Booking not found"
        ));
        exit;
    }
    
    if ($booking->user_id != $user_id) {
        http_response_code(403);
        echo json_encode(array(
            "success" => false,
            "message" => "You can only cancel your own bookings"
        ));
        exit;
    }
    
    if ($booking->status !== 'pending') {
        http_response_code(400);
        echo json_encode(array(
            "success" => false,
            "message" => "Only pending bookings can be cancelled"
        ));
        exit;
    }
    
    $booking->status = 'cancelled';
    
    if($booking->update()) {
        http_response_code(200);
        echo json_encode(array(
            "success" => true,
            "message" => "Booking cancelled successfully"
        ));
    } else {
        http_response_code(503);
        echo json_encode(array(
            "success" => false,
            "message" => "Unable to cancel booking"
        ));
    }
} else {
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => "Booking ID is required"
    ));
}
?> 