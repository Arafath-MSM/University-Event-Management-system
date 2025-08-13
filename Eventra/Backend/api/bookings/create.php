<?php
/**
 * Booking Create API Endpoint
 * Eventra ESRS Backend
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/Booking.php';
require_once '../../models/Venue.php';
require_once '../../utils/JWTUtil.php';

// Get database connection
$database = new Database();
$db = $database->getConnection();

// Initialize objects
$booking = new Booking($db);
$venue = new Venue($db);

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

if(!empty($data->venue_id) && !empty($data->event_title) && !empty($data->date) && !empty($data->time)) {
    
    // Check if venue exists and is available
    $venue->id = $data->venue_id;
    if (!$venue->readOne()) {
        http_response_code(400);
        echo json_encode(array(
            "success" => false,
            "message" => "Venue not found"
        ));
        exit;
    }

    // Check if venue is available for the requested date and time
    if (!$booking->isVenueAvailable($data->venue_id, $data->date, $data->time)) {
        http_response_code(400);
        echo json_encode(array(
            "success" => false,
            "message" => "Venue is not available for the selected date and time"
        ));
        exit;
    }
    
    // Set booking property values
    $booking->user_id = $user_id;
    $booking->venue_id = $data->venue_id;
    $booking->event_title = $data->event_title;
    $booking->description = $data->description ?? '';
    $booking->date = $data->date;
    $booking->time = $data->time;
    $booking->status = 'pending';
    $booking->participants = $data->participants ?? 1;
    $booking->facilities = is_array($data->facilities) ? json_encode($data->facilities) : ($data->facilities ?? '');

    // Create the booking
    $booking_id = $booking->create();
    
    if ($booking_id) {
        // Get the created booking data
        $booking->id = $booking_id;
        $booking->readOne();
        
        // Create notification for the user
        require_once '../../models/Notification.php';
        $notification = new Notification($db);
        $notification->createBookingRequestNotification(
            $user_id,
            $booking_id,
            $data->venue_id,
            $data->event_title
        );
        
        // Create notification for super-admin
        // First, get super-admin user ID
        require_once '../../models/User.php';
        $userModel = new User($db);
        $superAdminUsers = $userModel->read('super-admin');
        
        if (!empty($superAdminUsers)) {
            foreach ($superAdminUsers as $superAdmin) {
                $notification->createAdminNotification(
                    $superAdmin['id'],
                    'New Booking Request',
                    "New booking request for '{$data->event_title}' at venue ID {$data->venue_id}",
                    'booking_request'
                );
            }
        }
        
        // Set response code - 201 Created
        http_response_code(201);
        echo json_encode(array(
            "success" => true,
            "message" => "Booking created successfully",
            "data" => array(
                "id" => $booking->id,
                "user_id" => $booking->user_id,
                "venue_id" => $booking->venue_id,
                "event_title" => $booking->event_title,
                "description" => $booking->description,
                "date" => $booking->date,
                "time" => $booking->time,
                "status" => $booking->status,
                "participants" => $booking->participants,
                "facilities" => $booking->facilities,
                "created_at" => $booking->created_at
            )
        ));
    } else {
        // Set response code - 503 Service Unavailable
        http_response_code(503);
        echo json_encode(array(
            "success" => false,
            "message" => "Unable to create booking"
        ));
    }
} else {
    // Set response code - 400 Bad request
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => "Unable to create booking. Data is incomplete."
    ));
}
?> 