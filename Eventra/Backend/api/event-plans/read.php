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

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
$status = isset($_GET['status']) ? $_GET['status'] : null;
$type = isset($_GET['type']) ? $_GET['type'] : null;
$search = isset($_GET['search']) ? $_GET['search'] : null;

try {
    $stmt = $eventPlan->read($user_id, $status, $type, $search);
    $eventPlans = [];
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $approval_documents = $eventPlan->getApprovalDocuments($row['id']);
        
        $eventPlans[] = array(
            "id" => $row['id'],
            "user_id" => $row['user_id'],
            "title" => $row['title'],
            "type" => $row['type'],
            "organizer" => $row['organizer'],
            "date" => $row['date'],
            "time" => $row['time'],
            "participants" => $row['participants'],
            "status" => $row['status'],
            "current_stage" => $row['current_stage'],
            "facilities" => $row['facilities'] ? json_decode($row['facilities'], true) : null,
            "documents" => $row['documents'] ? json_decode($row['documents'], true) : null,
            "approval_documents" => $approval_documents ? json_decode($approval_documents, true) : null,
            "remarks" => $row['remarks'],
            "user_name" => $row['user_name'],
            "user_email" => $row['user_email'],
            "created_at" => $row['created_at'],
            "updated_at" => $row['updated_at']
        );
    }
    
    http_response_code(200);
    echo json_encode(array(
        "success" => true,
        "data" => $eventPlans
    ));
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "success" => false,
        "message" => "Failed to fetch event plans: " . $e->getMessage()
    ));
}
?> 