<?php
/**
 * Booking Cancel API Endpoint
 * Eventra ESRS Backend
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/Booking.php';
require_once '../../utils/JWTUtil.php';

// Get database connection
$database = new Database();
$db = $database->getConnection();

// Initialize booking object
$booking = new Booking($db);

// Get posted data
$data = json_decode(file_get_contents("php://input"));

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

if(!empty($data->booking_id)) {
    
    // Set booking ID
    $booking->id = $data->booking_id;
    
    // Check if booking exists and belongs to the user
    if (!$booking->readOne()) {
        http_response_code(404);
        echo json_encode(array(
            "success" => false,
            "message" => "Booking not found"
        ));
        exit;
    }
    
    // Check if the booking belongs to the current user
    if ($booking->user_id != $user_id) {
        http_response_code(403);
        echo json_encode(array(
            "success" => false,
            "message" => "You can only cancel your own bookings"
        ));
        exit;
    }
    
    // Check if booking can be cancelled (only pending bookings)
    if ($booking->status !== 'pending') {
        http_response_code(400);
        echo json_encode(array(
            "success" => false,
            "message" => "Only pending bookings can be cancelled"
        ));
        exit;
    }
    
    // Update booking status to cancelled
    $booking->status = 'cancelled';
    
    if($booking->update()) {
        // Set response code - 200 OK
        http_response_code(200);
        echo json_encode(array(
            "success" => true,
            "message" => "Booking cancelled successfully"
        ));
    } else {
        // Set response code - 503 Service Unavailable
        http_response_code(503);
        echo json_encode(array(
            "success" => false,
            "message" => "Unable to cancel booking"
        ));
    }
} else {
    // Set response code - 400 Bad request
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => "Booking ID is required"
    ));
}
?> 