<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/EventPlan.php';
require_once '../../models/SignedLetter.php';
require_once '../../models/Notification.php';
require_once '../../utils/JWTUtil.php';
require_once '../../services/ActivityLogger.php';

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

if ($payload['role'] !== 'super-admin') {
    http_response_code(403);
    echo json_encode(array("success" => false, "message" => "Access denied. Only Super Admin can approve event plans."));
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
        $signedLetterObj = new SignedLetter($db);
        $stmt = $signedLetterObj->read(null, $data->event_plan_id, null, null, 'approval');
        
        $authorityApprovals = [
            'vice-chancellor' => false,
            'warden' => false,
            'administration' => false,
            'student-union' => false
        ];
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if ($row['from_role'] === 'vice-chancellor' && $row['letter_type'] === 'approval') {
                $authorityApprovals['vice-chancellor'] = true;
            } elseif ($row['from_role'] === 'warden' && $row['letter_type'] === 'approval') {
                $authorityApprovals['warden'] = true;
            } elseif ($row['from_role'] === 'administration' && $row['letter_type'] === 'approval') {
                $authorityApprovals['administration'] = true;
            } elseif ($row['from_role'] === 'student-union' && $row['letter_type'] === 'approval') {
                $authorityApprovals['student-union'] = true;
            }
        }
        
        $allApproved = $authorityApprovals['vice-chancellor'] && 
                      $authorityApprovals['warden'] && 
                      $authorityApprovals['administration'] && 
                      $authorityApprovals['student-union'];
        
        if (!$allApproved) {
            $missingAuthorities = [];
            if (!$authorityApprovals['vice-chancellor']) $missingAuthorities[] = 'Vice Chancellor';
            if (!$authorityApprovals['warden']) $missingAuthorities[] = 'Warden';
            if (!$authorityApprovals['administration']) $missingAuthorities[] = 'Administration';
            if (!$authorityApprovals['student-union']) $missingAuthorities[] = 'Student Union';
            
            http_response_code(400);
            echo json_encode(array(
                "success" => false, 
                "message" => "Cannot approve event plan. Missing approvals from: " . implode(', ', $missingAuthorities)
            ));
            exit();
        }
        
        $eventPlan->status = 'approved';
    } else {
        $eventPlan->status = 'rejected';
    }
    
    if ($eventPlan->update()) {
        $notification->createAdminNotification(
            $eventPlan->user_id,
            "Event Plan " . ucfirst($data->action),
            "Your event plan '{$eventPlan->title}' has been {$data->action} by Super Admin.",
            'event_plan_status'
        );
        
        $notification->createAdminNotification(
            $payload['user_id'],
            "Event Plan " . ucfirst($data->action),
            "You have successfully {$data->action} the event plan '{$eventPlan->title}' by {$eventPlan->organizer}.",
            'event_plan_action_confirmation'
        );
        
        $logger = new ActivityLogger();
        if ($data->action === 'approve') {
            $logger->logEventPlanApproved($payload['user_id'], $eventPlan->id, $eventPlan->title, $_SERVER['REMOTE_ADDR'] ?? 'unknown');
        } else {
            $logger->logEventPlanRejected($payload['user_id'], $eventPlan->id, $eventPlan->title, $_SERVER['REMOTE_ADDR'] ?? 'unknown');
        }
        
        http_response_code(200);
        echo json_encode(array(
            "success" => true, 
            "message" => "Event plan " . $data->action . " successfully."
        ));
    } else {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Failed to update event plan status"));
    }
} else {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Missing required fields"));
}
?> 