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

if ($payload['role'] !== 'service-provider') {
    http_response_code(403);
    echo json_encode(array("success" => false, "message" => "Access denied. Only Service Provider can approve event plans."));
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->event_plan_id) && !empty($data->action)) {
    error_log("Service Provider Action: Event plan ID: {$data->event_plan_id}, Action: {$data->action}");
    $eventPlan->id = $data->event_plan_id;
    
    if (!$eventPlan->readOne()) {
        http_response_code(404);
        echo json_encode(array("success" => false, "message" => "Event plan not found"));
        exit();
    }
    
    error_log("Service Provider Action: Current event plan status: {$eventPlan->status}");
    if ($eventPlan->status !== 'submitted' && $eventPlan->status !== 'forwarded_to_service_provider') {
        error_log("Service Provider Action: Invalid status '{$eventPlan->status}' for event plan {$data->event_plan_id}");
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Event plan is not in submitted or forwarded status"));
        exit();
    }
    
    if ($data->action === 'approve') {
        $eventPlan->status = 'approved';
        $eventPlan->remarks = $data->comment ?? '';
        $updateResult = $eventPlan->update();
        error_log("Service Provider Approval: Event plan {$data->event_plan_id} status updated to 'approved'. Update result: " . ($updateResult ? 'success' : 'failed'));
        $letter_content = $data->comment ?? "Event plan '{$eventPlan->title}' has been approved by Service Provider. All service requirements can be fulfilled.";
    } else {
        $eventPlan->status = 'rejected';
        $eventPlan->remarks = $data->comment ?? '';
        $updateResult = $eventPlan->update();
        error_log("Service Provider Rejection: Event plan {$data->event_plan_id} status updated to 'rejected'. Update result: " . ($updateResult ? 'success' : 'failed'));
        
        $letter_content = $data->comment ?? "Event plan '{$eventPlan->title}' has been rejected by Service Provider.";
    }
    
    $signedLetter->event_plan_id = $data->event_plan_id;
    $signedLetter->from_role = 'service-provider';
    $signedLetter->to_role = 'super-admin';
    $signedLetter->letter_type = $data->action === 'approve' ? 'approval' : 'rejection';
    $signedLetter->letter_content = $letter_content;
    $signedLetter->signature_data = $data->signature_data ?? null;
    $signedLetter->status = 'sent';
    
    if ($signedLetter->create()) {
        $signedLetter->markAsSent();
        
        $notification->createEventPlanNotification(
            $eventPlan->user_id,
            'Service Provider ' . ucfirst($data->action) . ' Received',
            "Your event plan '{$eventPlan->title}' has been {$data->action} by Service Provider.",
            'event_plan_' . $data->action,
            $data->event_plan_id
        );
        
        $notification->createEventPlanNotification(
            $payload['user_id'],
            'Event Plan ' . ucfirst($data->action) . ' Sent',
            "You have successfully {$data->action} the event plan '{$eventPlan->title}' by {$eventPlan->organizer}.",
            'event_plan_action_confirmation',
            $data->event_plan_id
        );
        
        $notification->createEventPlanNotification(
            1,
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
