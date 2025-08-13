<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/EventPlan.php';
require_once '../../models/SignedLetter.php';
require_once '../../models/Notification.php';
require_once '../../utils/JWTUtil.php';

header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();
$eventPlan = new EventPlan($db);
$signedLetter = new SignedLetter($db);
$notification = new Notification($db);

$token = JWTUtil::getTokenFromHeader();
$payload = JWTUtil::validateToken($token);

if (!$payload) {
    http_response_code(401);
    echo json_encode(array("success" => false, "message" => "Unauthorized"));
    exit();
}

if ($payload['role'] !== 'vice-chancellor') {
    http_response_code(403);
    echo json_encode(array("success" => false, "message" => "Access denied. Only Vice Chancellor can approve event plans."));
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->event_plan_id) && !empty($data->action)) {
    $eventPlan->id = $data->event_plan_id;
    
    if (!$eventPlan->readOne()) {
        http_response_code(404);
        echo json_encode(array("success" => false, "message" => "Event plan not found"));
        exit();
    }
    
    if ($eventPlan->status !== 'submitted') {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Event plan is not in submitted status"));
        exit();
    }
    
    $new_status = ($data->action === 'approve') ? 'approved' : 'rejected';
    $eventPlan->status = $new_status;
    
    if ($eventPlan->update()) {
        $letter_content = $data->comment ?? '';
        if ($data->action === 'approve') {
            $letter_content = $letter_content ?: "Event plan '{$eventPlan->title}' has been approved by Vice Chancellor. All academic requirements have been met.";
        } else {
            $letter_content = $letter_content ?: "Event plan '{$eventPlan->title}' has been rejected by Vice Chancellor.";
        }
        
        $signedLetter->booking_id = $eventPlan->id;
        $signedLetter->from_role = 'vice-chancellor';
        $signedLetter->to_role = 'super-admin';
        $signedLetter->letter_type = $data->action === 'approve' ? 'approval' : 'rejection';
        $signedLetter->letter_content = $letter_content;
        $signedLetter->signature_data = $data->signature_data ?? null;
        $signedLetter->status = 'sent';
        
        if ($signedLetter->create()) {
            $signedLetter->markAsSent();
            
            $notification->createAdminNotification(
                $eventPlan->user_id,
                "Event Plan " . ucfirst($new_status),
                "Your event plan '{$eventPlan->title}' has been {$new_status} by Vice Chancellor.",
                'event_plan_status'
            );
            
            $notification->createAdminNotification(
                $payload['user_id'],
                "Event Plan " . ucfirst($new_status),
                "You have successfully {$new_status} the event plan '{$eventPlan->title}' by {$eventPlan->organizer}.",
                'event_plan_action_confirmation'
            );
            
            http_response_code(200);
            echo json_encode(array(
                "success" => true, 
                "message" => "Event plan " . $new_status . " successfully. Signed letter created and sent to admin."
            ));
        } else {
            http_response_code(500);
            echo json_encode(array("success" => false, "message" => "Failed to create signed letter"));
        }
    } else {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Failed to update event plan status"));
    }
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Missing required fields"));
}
?> 