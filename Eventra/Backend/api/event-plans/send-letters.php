<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/EventPlan.php';
require_once '../../models/SignedLetter.php';
require_once '../../models/Notification.php';
require_once '../../models/User.php';
require_once '../../utils/JWTUtil.php';

header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();
$eventPlan = new EventPlan($db);
$signedLetter = new SignedLetter($db);
$notification = new Notification($db);
$userModel = new User($db);

$token = JWTUtil::getTokenFromHeader();
$payload = JWTUtil::validateToken($token);

if (!$payload) {
    http_response_code(401);
    echo json_encode(array("success" => false, "message" => "Unauthorized"));
    exit();
}

if ($payload['role'] !== 'super-admin') {
    http_response_code(403);
    echo json_encode(array("success" => false, "message" => "Access denied. Only Super Admin can send letters."));
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
    
    $authorities = [
        'vice-chancellor' => 'Vice Chancellor',
        'warden' => 'Warden',
        'student-union' => 'Student Union',
        'administration' => 'Administration'
    ];
    
    $sentLetters = [];
    $errors = [];
    
    foreach ($authorities as $role => $title) {
        $signedLetter->booking_id = $eventPlan->id;
        $signedLetter->from_role = 'super-admin';
        $signedLetter->to_role = $role;
        $signedLetter->letter_type = 'approval';
        $signedLetter->letter_content = "Please review and approve the event plan '{$eventPlan->title}' by {$eventPlan->organizer}. Event details: Date: {$eventPlan->date}, Time: {$eventPlan->time}, Participants: {$eventPlan->participants}.";
        $signedLetter->signature_data = null;
        $signedLetter->status = 'sent';
        
        if ($signedLetter->create()) {
            $signedLetter->markAsSent();
            $sentLetters[] = $role;
            
            $authorityUsers = $userModel->read($role);
            if (!empty($authorityUsers)) {
                foreach ($authorityUsers as $authorityUser) {
                    $notification->createAdminNotification(
                        $authorityUser['id'],
                        'Event Plan Review Request',
                        "You have received a request to review event plan '{$eventPlan->title}' by {$eventPlan->organizer}.",
                        'event_plan_request'
                    );
                }
            }
        } else {
            $errors[] = "Failed to send letter to {$title}";
        }
    }
    
    $eventPlan->current_stage = 2;
    $eventPlan->update();
    
    $notification->createAdminNotification(
        $eventPlan->user_id,
        'Letters Sent',
        "Review letters have been sent to all authorities for your event plan '{$eventPlan->title}'.",
        'event_plan_submitted'
    );
    
    $notification->createAdminNotification(
        $payload['user_id'],
        'Letters Sent Successfully',
        "Review letters have been sent to all authorities for event plan '{$eventPlan->title}'.",
        'event_plan_action_confirmation'
    );
    
    if (empty($errors)) {
        http_response_code(200);
        echo json_encode(array(
            "success" => true,
            "message" => "Letters sent successfully to all authorities",
            "data" => array(
                "sent_to" => $sentLetters,
                "event_plan_id" => $eventPlan->id,
                "event_title" => $eventPlan->title
            )
        ));
    } else {
        http_response_code(207);
        echo json_encode(array(
            "success" => false,
            "message" => "Some letters failed to send",
            "errors" => $errors,
            "sent_to" => $sentLetters
        ));
    }
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Missing event_plan_id"));
}
?> 