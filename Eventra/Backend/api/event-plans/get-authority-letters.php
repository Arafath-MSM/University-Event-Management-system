<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../../config/database.php';

$database = new Database();
$conn = $database->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $eventPlanId = isset($_GET['eventPlanId']) ? (int)$_GET['eventPlanId'] : null;
        
        if (!$eventPlanId) {
            throw new Exception('Event plan ID is required');
        }
        
        $query = "SELECT 
                    sl.id,
                    sl.from_role,
                    sl.letter_type,
                    sl.letter_content,
                    sl.status,
                    sl.created_at,
                    sl.sent_at,
                    sl.received_at,
                    u.name as authority_name,
                    u.email as authority_email
                  FROM signed_letters sl
                  LEFT JOIN users u ON u.role = sl.from_role
                  WHERE sl.event_plan_id = ? 
                  AND sl.letter_type = 'approval'
                  AND sl.from_role IN ('vice-chancellor', 'warden', 'administration', 'student-union')
                  ORDER BY sl.created_at ASC";
        
        $stmt = $conn->prepare($query);
        $stmt->execute([$eventPlanId]);
        
        $authorityLetters = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $authorityLetters[] = [
                'id' => $row['id'],
                'role' => $row['from_role'],
                'role_display_name' => getRoleDisplayName($row['from_role']),
                'letter_type' => $row['letter_type'],
                'letter_content' => $row['letter_content'],
                'status' => $row['status'],
                'created_at' => $row['created_at'],
                'sent_at' => $row['sent_at'],
                'received_at' => $row['received_at'],
                'authority_name' => $row['authority_name'],
                'authority_email' => $row['authority_email']
            ];
        }
        
        echo json_encode([
            'success' => true,
            'data' => $authorityLetters,
            'count' => count($authorityLetters)
        ]);
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}

function getRoleDisplayName($role) {
    $roleNames = [
        'vice-chancellor' => 'Vice Chancellor',
        'warden' => 'Warden',
        'administration' => 'University Administration',
        'student-union' => 'Student Union'
    ];
    
    return $roleNames[$role] ?? ucfirst(str_replace('-', ' ', $role));
}
?>
