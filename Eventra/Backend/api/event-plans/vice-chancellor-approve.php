<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/database.php';
include_once '../../models/EventPlan.php';
include_once '../../models/Notification.php';
include_once '../../models/SignedLetter.php';
include_once '../../models/User.php';
include_once '../../utils/JWTUtil.php';

$database = new Database();
$db = $database->getConnection();

$eventPlan = new EventPlan($db);
$notification = new Notification($db);
$signedLetter = new SignedLetter($db);
$user = new User($db);

$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(array("success" => false, "message" => "Authorization token required."));
    exit;
}

$token = $matches[1];

$payload = JWTUtil::validateToken($token);

if (!$payload) {
    http_response_code(401);
    echo json_encode(array("success" => false, "message" => "Invalid or expired token."));
    exit;
}

$user->id = $payload['user_id'];

$userFound = $user->readOne();

if (!$userFound) {
    http_response_code(401);
    echo json_encode(array("success" => false, "message" => "User not found."));
    exit;
}

if ($user->role !== 'vice-chancellor') {
    http_response_code(403);
    echo json_encode(array("success" => false, "message" => "Access denied. Only Vice Chancellor can approve/reject event plans."));
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($data->event_plan_id)) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Event plan ID is required."));
        exit;
    }

    $eventPlan->id = $data->event_plan_id;
    $eventPlanResult = $eventPlan->readOne();

    if (!$eventPlanResult) {
        http_response_code(404);
        echo json_encode(array("success" => false, "message" => "Event plan not found."));
        exit;
    }

    if ($data->action === 'approve') {
        $eventPlan->remarks = $data->comment ?? '';
        
        if ($eventPlan->update()) {
            $signedLetter->event_plan_id = $data->event_plan_id;
            $signedLetter->from_role = 'vice-chancellor';
            $signedLetter->to_role = 'super-admin';
            $signedLetter->letter_type = 'approval';
            $signedLetter->letter_content = $data->signed_document ?? '';
            $signedLetter->signature_data = $data->signed_document ?? null;
            $signedLetter->status = 'sent';
            
            $signedLetterCreated = $signedLetter->create();
            
            $notification->createEventPlanNotification(
                $user->id,
                'Event Plan Approval Sent',
                "You have sent your approval for event plan '{$eventPlan->title}' to Super-Admin.",
                'event_plan_approved',
                $data->event_plan_id
            );

            $notification->createEventPlanNotification(
                $eventPlan->user_id,
                'Vice Chancellor Approval Received',
                "Vice Chancellor has approved your event plan '{$eventPlan->title}' and sent signed document to Super-Admin.",
                'event_plan_approved',
                $data->event_plan_id
            );

            $notification->createEventPlanNotification(
                1,
                'Vice Chancellor Approval Received',
                "Vice Chancellor has approved event plan '{$eventPlan->title}' and sent signed document.",
                'event_plan_action_confirmation',
                $data->event_plan_id
            );

            http_response_code(200);
            echo json_encode(array(
                "success" => true,
                "message" => "Event plan approval sent to Super-Admin successfully."
            ));
        } else {
            http_response_code(500);
            echo json_encode(array("success" => false, "message" => "Failed to update event plan."));
        }
    } elseif ($data->action === 'reject') {
        $eventPlan->status = 'rejected';
        $eventPlan->remarks = $data->comment ?? '';
        
        if ($eventPlan->update()) {
            $notification->createEventPlanNotification(
                $user->id,
                'Event Plan Rejected',
                "You have rejected event plan '{$eventPlan->title}'.",
                'event_plan_rejected',
                $data->event_plan_id
            );

            $notification->createEventPlanNotification(
                $eventPlan->user_id,
                'Event Plan Rejected',
                "Your event plan '{$eventPlan->title}' has been rejected by Vice Chancellor.",
                'event_plan_rejected',
                $data->event_plan_id
            );

            $notification->createEventPlanNotification(
                1,
                'Event Plan Rejected by VC',
                "Vice Chancellor has rejected event plan '{$eventPlan->title}'.",
                'event_plan_action_confirmation',
                $data->event_plan_id
            );

            http_response_code(200);
            echo json_encode(array(
                "success" => true,
                "message" => "Event plan rejected successfully."
            ));
        } else {
            http_response_code(500);
            echo json_encode(array("success" => false, "message" => "Failed to update event plan."));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "Invalid action. Use 'approve' or 'reject'."));
    }
} else {
    http_response_code(405);
    echo json_encode(array("success" => false, "message" => "Method not allowed."));
}
?> 