<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/SignedLetter.php';
require_once '../../utils/JWTUtil.php';

header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();
$signedLetter = new SignedLetter($db);

$token = JWTUtil::getTokenFromHeader();
$payload = JWTUtil::validateToken($token);

if (!$payload) {
    http_response_code(401);
    echo json_encode(array("success" => false, "message" => "Unauthorized"));
    exit();
}

$booking_id = isset($_GET['booking_id']) ? (int)$_GET['booking_id'] : null;
$event_plan_id = isset($_GET['event_plan_id']) ? (int)$_GET['event_plan_id'] : null;
$from_role = isset($_GET['from_role']) ? $_GET['from_role'] : null;
$status = isset($_GET['status']) ? $_GET['status'] : null;
$letter_type = isset($_GET['letter_type']) ? $_GET['letter_type'] : null;

try {
    $stmt = $signedLetter->read($booking_id, $event_plan_id, $from_role, $status, $letter_type);
    $signedLetters = [];
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $signedLetters[] = array(
            "id" => $row['id'],
            "booking_id" => $row['booking_id'],
            "event_plan_id" => $row['event_plan_id'],
            "from_role" => $row['from_role'],
            "to_role" => $row['to_role'],
            "letter_type" => $row['letter_type'],
            "letter_content" => $row['letter_content'],
            "signature_data" => $row['signature_data'] ? json_decode($row['signature_data'], true) : null,
            "status" => $row['status'],
            "sent_at" => $row['sent_at'],
            "received_at" => $row['received_at'],
            "event_title" => $row['event_title'],
            "user_name" => $row['user_name'],
            "created_at" => $row['created_at'],
            "updated_at" => $row['updated_at']
        );
    }
    
    http_response_code(200);
    echo json_encode(array(
        "success" => true,
        "data" => $signedLetters
    ));
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "success" => false,
        "message" => "Failed to fetch signed letters: " . $e->getMessage()
    ));
}
?> 