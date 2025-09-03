<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/Booking.php';
require_once '../../models/Notification.php';
require_once '../../models/User.php';
require_once '../../utils/JWTUtil.php';
require_once '../../services/ActivityLogger.php';
require_once '../../config/email.php';

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
        
        try {
            $userModel = new User($db);
            $userModel->id = $booking->user_id;
            if ($userModel->readOne()) {
                $recipientEmail = $userModel->email;
                $recipientName = $userModel->name;
                
                $statusText = ($new_status === 'approved') ? 'Approved' : 'Rejected';
                $subject = "Your Venue Booking has been {$statusText} - {$booking->event_title}";
                
                $dateText = $booking->date;
                $timeText = $booking->time;
                
                $body = "<!DOCTYPE html><html><head><meta charset='UTF-8'><style>
                    body{font-family:Arial,sans-serif;color:#333} .container{max-width:600px;margin:0 auto;padding:20px}
                    .header{background:" . ($new_status === 'approved' ? '#27ae60' : '#c0392b') . ";color:#fff;padding:16px;border-radius:8px 8px 0 0}
                    .content{background:#f8f9fa;padding:24px;border:1px solid #ececec;border-top:0;border-radius:0 0 8px 8px}
                    .badge{display:inline-block;padding:4px 10px;border-radius:999px;font-size:12px;color:#fff;background:" . ($new_status === 'approved' ? '#2ecc71' : '#e74c3c') . ";}
                </style></head><body><div class='container'>
                <div class='header'><h2>" . ($new_status === 'approved' ? '✅ Booking Approved' : '❌ Booking Rejected') . "</h2></div>
                <div class='content'>
                    <p>Dear <strong>{$recipientName}</strong>,</p>
                    <p>Your venue booking request has been <span class='badge'>{$statusText}</span>.</p>
                    <p><strong>Event:</strong> {$booking->event_title}<br/>
                       <strong>Date:</strong> {$dateText}<br/>
                       <strong>Time:</strong> {$timeText}</p>
                    <p>" . ($new_status === 'approved' 
                        ? 'You can proceed with your planning. Thank you for using the Event Management System.' 
                        : 'Please review your request details and consider submitting a new booking if needed.') . "</p>
                    <p>Best regards,<br/><strong>University Event Management System</strong></p>
                </div></div></body></html>";
                
                global $emailService;
                if (isset($emailService)) {
                    $emailService->sendSimpleEmail($recipientEmail, $subject, $body);
                }
            }
        } catch (Exception $e) {
            error_log('Booking approval email error: ' . $e->getMessage());
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