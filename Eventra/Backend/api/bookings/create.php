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

$database = new Database();
$db = $database->getConnection();

$booking = new Booking($db);
$venue = new Venue($db);

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

if(!empty($data->venue_id) && !empty($data->event_title) && !empty($data->date) && !empty($data->time)) {
    
    $venue->id = $data->venue_id;
    if (!$venue->readOne()) {
        http_response_code(400);
        echo json_encode(array(
            "success" => false,
            "message" => "Venue not found"
        ));
        exit;
    }

    if (!$booking->isVenueAvailable($data->venue_id, $data->date, $data->time)) {
        http_response_code(400);
        echo json_encode(array(
            "success" => false,
            "message" => "Venue is not available for the selected date and time"
        ));
        exit;
    }
    
    $booking->user_id = $user_id;
    $booking->venue_id = $data->venue_id;
    $booking->event_title = $data->event_title;
    $booking->description = $data->description ?? '';
    $booking->date = $data->date;
    $booking->time = $data->time;
    $booking->status = 'pending';
    $booking->participants = $data->participants ?? 1;
    $booking->facilities = is_array($data->facilities) ? json_encode($data->facilities) : ($data->facilities ?? '');

    $booking_id = $booking->create();
    
    if ($booking_id) {
        $booking->id = $booking_id;
        $booking->readOne();
        
        require_once '../../models/Notification.php';
        $notification = new Notification($db);
        $notification->createBookingRequestNotification(
            $user_id,
            $booking_id,
            $data->venue_id,
            $data->event_title
        );
        
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
        http_response_code(503);
        echo json_encode(array(
            "success" => false,
            "message" => "Unable to create booking"
        ));
    }
} else {
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => "Unable to create booking. Data is incomplete."
    ));
}
?> 