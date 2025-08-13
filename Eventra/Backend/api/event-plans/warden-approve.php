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

if ($payload['role'] !== 'warden') {
    http_response_code(403);
    echo json_encode(array("success" => false, "message" => "Access denied. Only Warden can approve event plans."));
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
        $letter_content = $data->comment ?? "Event plan '{$eventPlan->title}' has been approved by Warden. All residential requirements have been met.";
    } else {
        $eventPlan->status = 'rejected';
        $eventPlan->remarks = $data->comment ?? '';
        $eventPlan->update();
        
        $letter_content = $data->comment ?? "Event plan '{$eventPlan->title}' has been rejected by Warden.";
    }
    
    $signedLetter->event_plan_id = $data->event_plan_id;
    $signedLetter->from_role = 'warden';
    $signedLetter->to_role = 'super-admin';
    $signedLetter->letter_type = $data->action === 'approve' ? 'approval' : 'rejection';
    $signedLetter->letter_content = $data->signed_document ?? $letter_content;
    $signedLetter->signature_data = null;
    $signedLetter->status = 'sent';
    
    if ($signedLetter->create()) {
        $signedLetter->markAsSent();
        
        $notification->createEventPlanNotification(
            $eventPlan->user_id,
            $data->action === 'approve' ? 'Warden Approval Received' : 'Event Plan Rejected',
            $data->action === 'approve' 
                ? "Warden has approved your event plan '{$eventPlan->title}' and sent signed document to Super-Admin."
                : "Your event plan '{$eventPlan->title}' has been rejected by Warden.",
            'event_plan_' . $data->action,
            $data->event_plan_id
        );
        
        $notification->createEventPlanNotification(
            $payload['user_id'],
            $data->action === 'approve' ? 'Event Plan Approval Sent' : 'Event Plan Rejected',
            $data->action === 'approve'
                ? "You have sent your approval for event plan '{$eventPlan->title}' to Super-Admin."
                : "You have rejected event plan '{$eventPlan->title}'.",
            'event_plan_' . $data->action,
            $data->event_plan_id
        );

        require_once '../../models/User.php';
        $userModel = new User($db);
        $superAdminUsers = $userModel->read('super-admin');
        
        if (!empty($superAdminUsers)) {
            foreach ($superAdminUsers as $superAdmin) {
                $notification->createEventPlanNotification(
                    $superAdmin['id'],
                    $data->action === 'approve' ? 'Warden Approval Received' : 'Event Plan Rejected by Warden',
                    $data->action === 'approve'
                        ? "Warden has approved event plan '{$eventPlan->title}' and sent signed document."
                        : "Warden has rejected event plan '{$eventPlan->title}'.",
                    'event_plan_action_confirmation',
                    $data->event_plan_id
                );
            }
        }
        
        http_response_code(200);
        echo json_encode(array(
            "success" => true, 
            "message" => "Event plan " . $data->action . " successfully. Signed letter created and sent to admin."
        ));
    } else {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Failed to create signed letter"));
    }
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Missing required fields"));
}
?> 