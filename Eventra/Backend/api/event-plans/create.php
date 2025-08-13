<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/EventPlan.php';
require_once '../../models/Notification.php';
require_once '../../models/User.php';
require_once '../../utils/JWTUtil.php';

header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();
$eventPlan = new EventPlan($db);
$notification = new Notification($db);
$userModel = new User($db);

$token = JWTUtil::getTokenFromHeader();
$payload = JWTUtil::validateToken($token);

if (!$payload) {
    http_response_code(401);
    echo json_encode(array("success" => false, "message" => "Unauthorized"));
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->title) && !empty($data->type) && !empty($data->organizer) && !empty($data->date)) {
    $eventPlan->user_id = $payload['user_id'];
    $eventPlan->title = $data->title;
    $eventPlan->type = $data->type;
    $eventPlan->organizer = $data->organizer;
    $eventPlan->date = $data->date;
    $eventPlan->time = $data->time ?? '';
    $eventPlan->participants = $data->participants ?? 0;
    $eventPlan->status = 'submitted';
    $eventPlan->current_stage = 1;
    $eventPlan->facilities = $data->facilities ?? [];
    $eventPlan->documents = $data->documents ?? [];
    $eventPlan->approval_documents = $data->approval_documents ?? null;
    $eventPlan->remarks = $data->remarks ?? '';

    $event_plan_id = $eventPlan->create();
    
    if ($event_plan_id) {
        $eventPlan->id = $event_plan_id;
        $eventPlan->readOne();
        
        $notification->createAdminNotification(
            $payload['user_id'],
            'Event Plan Submitted',
            "Your event plan '{$data->title}' has been submitted successfully and is pending approval.",
            'event_plan_submitted'
        );
        
        $superAdminUsers = $userModel->read('super-admin');
        
        if (!empty($superAdminUsers)) {
            foreach ($superAdminUsers as $superAdmin) {
                $notification->createAdminNotification(
                    $superAdmin['id'],
                    'New Event Plan Request',
                    "New event plan request for '{$data->title}' by {$data->organizer}",
                    'event_plan_request'
                );
            }
        }
        
        $viceChancellorUsers = $userModel->read('vice-chancellor');
        
        if (!empty($viceChancellorUsers)) {
            foreach ($viceChancellorUsers as $viceChancellor) {
                $notification->createAdminNotification(
                    $viceChancellor['id'],
                    'New Event Plan Request',
                    "New event plan request for '{$data->title}' by {$data->organizer}",
                    'event_plan_request'
                );
            }
        }
        
        http_response_code(201);
        echo json_encode(array(
            "success" => true,
            "message" => "Event plan created successfully",
            "data" => array(
                "id" => $event_plan_id,
                "title" => $data->title,
                "type" => $data->type,
                "organizer" => $data->organizer,
                "date" => $data->date,
                "time" => $data->time,
                "participants" => $data->participants,
                "status" => 'submitted',
                "current_stage" => 1
            )
        ));
        
    } else {
        http_response_code(500);
        echo json_encode(array(
            "success" => false,
            "message" => "Failed to create event plan"
        ));
    }
} else {
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => "Missing required fields"
    ));
}
?> 