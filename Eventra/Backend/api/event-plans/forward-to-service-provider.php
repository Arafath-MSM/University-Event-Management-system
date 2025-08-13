<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/EventPlan.php';
require_once '../../models/Notification.php';
require_once '../../utils/JWTUtil.php';

header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();
$eventPlan = new EventPlan($db);
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
    echo json_encode(array("success" => false, "message" => "Access denied. Only Super-Admin can forward event plans to Service Provider."));
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->event_plan_id)) {
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
    
    $eventPlan->status = 'forwarded_to_service_provider';
    $eventPlan->remarks = ($eventPlan->remarks ? $eventPlan->remarks . ' ' : '') . 'Forwarded to Service Provider for service approval.';
    
    if ($eventPlan->update()) {
        $notification->createEventPlanNotification(
            2,
            'New Event Plan Forwarded for Service Approval',
            "Event plan '{$eventPlan->title}' by {$eventPlan->organizer} has been forwarded to you for service approval. Please review the service requirements and approve/reject accordingly.",
            'event_plan_forwarded_to_service_provider',
            $data->event_plan_id
        );
        
        $notification->createEventPlanNotification(
            $eventPlan->user_id,
            'Event Plan Forwarded to Service Provider',
            "Your event plan '{$eventPlan->title}' has been forwarded to Service Provider for service approval. You will be notified once the service provider reviews your request.",
            'event_plan_forwarded_to_service_provider',
            $data->event_plan_id
        );
        
        $notification->createEventPlanNotification(
            $payload['user_id'],
            'Event Plan Forwarded Successfully',
            "Event plan '{$eventPlan->title}' by {$eventPlan->organizer} has been successfully forwarded to Service Provider for service approval.",
            'event_plan_forwarded_to_service_provider',
            $data->event_plan_id
        );
        
        echo json_encode(array(
            "success" => true,
            "message" => "Event plan forwarded to Service Provider successfully.",
            "data" => array(
                "event_plan_id" => $data->event_plan_id,
                "status" => "forwarded_to_service_provider",
                "message" => "Event plan has been forwarded to Service Provider for service approval"
            )
        ));
    } else {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Failed to update event plan status"));
    }
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Missing required field: event_plan_id"));
}
?>
