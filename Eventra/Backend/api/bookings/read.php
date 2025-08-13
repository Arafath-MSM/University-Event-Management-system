<?php
/**
 * Bookings Read API Endpoint
 * Eventra ESRS Backend
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/Booking.php';

$database = new Database();
$db = $database->getConnection();

$booking = new Booking($db);

$user_id = $_GET['user_id'] ?? null;
$status = $_GET['status'] ?? null;
$search = $_GET['search'] ?? null;
$date_from = $_GET['date_from'] ?? null;
$date_to = $_GET['date_to'] ?? null;

try {
    $stmt = $booking->read($user_id, $status, $search, $date_from, $date_to);
    $bookings = [];
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $bookings[] = array(
            "id" => $row['id'],
            "user_id" => $row['user_id'],
            "venue_id" => $row['venue_id'],
            "event_title" => $row['event_title'],
            "description" => $row['description'],
            "date" => $row['date'],
            "time" => $row['time'],
            "status" => $row['status'],
            "participants" => $row['participants'],
            "facilities" => $row['facilities'],
            "venue_name" => $row['venue_name'],
            "user_name" => $row['user_name'],
            "created_at" => $row['created_at'],
            "updated_at" => $row['updated_at']
        );
    }
    
    http_response_code(200);
    echo json_encode(array(
        "success" => true,
        "message" => "Bookings retrieved successfully",
        "data" => $bookings
    ));
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "success" => false,
        "message" => "Unable to retrieve bookings: " . $e->getMessage()
    ));
}
?> 