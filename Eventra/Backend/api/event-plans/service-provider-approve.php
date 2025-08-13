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

// Get JWT token and validate
$token = JWTUtil::getTokenFromHeader();
$payload = JWTUtil::validateToken($token);

if (!$payload) {
    http_response_code(401);
    echo json_encode(array("success" => false, "message" => "Unauthorized"));
    exit();
}

// Check if user is service-provider
if ($payload['role'] !== 'service-provider') {
    http_response_code(403);
    echo json_encode(array("success" => false, "message" => "Access denied. Only Service Provider can approve event plans."));
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
    
    if ($data->action === 'approve') {
        // Don't change the event plan status - keep it as 'submitted'
        // Just create the signed letter and send notification
        $letter_content = $data->comment ?? "Event plan '{$eventPlan->title}' has been approved by Service Provider. All service requirements can be fulfilled.";
    } else {
        // For rejection, we can change the status to rejected
        $eventPlan->status = 'rejected';
        $eventPlan->remarks = $data->comment ?? '';
        $eventPlan->update();
        
        $letter_content = $data->comment ?? "Event plan '{$eventPlan->title}' has been rejected by Service Provider.";
    }
    
    // Create signed letter
    $signedLetter->event_plan_id = $data->event_plan_id;
    $signedLetter->from_role = 'service-provider';
    $signedLetter->to_role = 'super-admin';
    $signedLetter->letter_type = $data->action === 'approve' ? 'approval' : 'rejection';
    $signedLetter->letter_content = $letter_content;
    $signedLetter->signature_data = $data->signature_data ?? null;
    $signedLetter->status = 'sent';
    
    if ($signedLetter->create()) {
        // Mark letter as sent
        $signedLetter->markAsSent();
        
        // Create notification for the event plan owner
        $notification->createEventPlanNotification(
            $eventPlan->user_id,
            'Service Provider ' . ucfirst($data->action) . ' Received',
            "Your event plan '{$eventPlan->title}' has been {$data->action} by Service Provider.",
            'event_plan_' . $data->action,
            $data->event_plan_id
        );
        
        // Create notification for Service Provider (current user)
        $notification->createEventPlanNotification(
            $payload['user_id'],
            'Event Plan ' . ucfirst($data->action) . ' Sent',
            "You have successfully {$data->action} the event plan '{$eventPlan->title}' by {$eventPlan->organizer}.",
            'event_plan_action_confirmation',
            $data->event_plan_id
        );
        
        // Create notification for super-admin
        $notification->createEventPlanNotification(
            1, // Super-admin user ID (assuming it's 1)
            'Service Provider ' . ucfirst($data->action) . ' Received',
            "Service Provider has {$data->action} event plan '{$eventPlan->title}' by {$eventPlan->organizer}.",
            'event_plan_action_confirmation',
            $data->event_plan_id
        );
        
        echo json_encode(array(
            "success" => true,
            "message" => "Event plan " . $data->action . " successfully. Signed letter sent to Super-Admin.",
            "data" => array(
                "event_plan_id" => $data->event_plan_id,
                "action" => $data->action,
                "letter_content" => $letter_content
            )
        ));
    } else {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Failed to create signed letter"));
    }
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Missing required fields: event_plan_id and action"));
}
?>
