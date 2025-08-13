<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/EventPlan.php';
require_once '../../utils/JWTUtil.php';

header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();
$eventPlan = new EventPlan($db);

$token = JWTUtil::getTokenFromHeader();
$payload = JWTUtil::validateToken($token);

if (!$payload) {
    http_response_code(401);
    echo json_encode(array("success" => false, "message" => "Unauthorized"));
    exit();
}

$event_plan_id = isset($_GET['event_plan_id']) ? (int)$_GET['event_plan_id'] : null;

if (!$event_plan_id) {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Event plan ID is required"));
    exit();
}

try {
    $approval_documents = $eventPlan->getApprovalDocuments($event_plan_id);
    
    if ($approval_documents) {
        $decoded_documents = json_decode($approval_documents, true);
        
        http_response_code(200);
        echo json_encode(array(
            "success" => true,
            "data" => $decoded_documents
        ));
    } else {
        http_response_code(404);
        echo json_encode(array(
            "success" => false,
            "message" => "Event plan not found or no approval documents"
        ));
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "success" => false,
        "message" => "Failed to fetch approval documents: " . $e->getMessage()
    ));
}
?> 