<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/EventPlan.php';
require_once '../../models/User.php';
require_once '../../models/Venue.php';
require_once '../../utils/JWTUtil.php';

header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();

$token = JWTUtil::getTokenFromHeader();
$payload = JWTUtil::validateToken($token);

if (!$payload) {
    http_response_code(401);
    echo json_encode(array("success" => false, "message" => "Unauthorized"));
    exit();
}

if ($payload['role'] !== 'super-admin') {
    http_response_code(403);
    echo json_encode(array("success" => false, "message" => "Access denied. Only super-admin can access reports."));
    exit();
}

$startDate = $_GET['start_date'] ?? date('Y-m-01');
$endDate = $_GET['end_date'] ?? date('Y-m-t');
$eventType = $_GET['event_type'] ?? null;
$venueId = $_GET['venue_id'] ?? null;
$status = $_GET['status'] ?? null;
$limit = $_GET['limit'] ?? 50;
$offset = $_GET['offset'] ?? 0;

try {
    $baseQuery = "
        SELECT 
            ep.id,
            ep.title,
            ep.type as event_type,
            ep.organizer as description,
            ep.participants as expected_participants,
            ep.status,
            ep.created_at,
            ep.updated_at,
            u.name as organizer_name,
            u.email as organizer_email,
            u.role as organizer_role,
            'N/A' as venue_name,
            'N/A' as venue_capacity
        FROM event_plans ep
        LEFT JOIN users u ON ep.user_id = u.id
        WHERE DATE(ep.created_at) BETWEEN ? AND ?
    ";
    
    $params = [$startDate, $endDate];
    
    if ($eventType && $eventType !== 'all') {
        $baseQuery .= " AND ep.title LIKE ?";
        $params[] = "%$eventType%";
    }
    
    if ($venueId && $venueId !== 'all') {
        $baseQuery .= " AND ep.venue_id = ?";
        $params[] = $venueId;
    }
    
    if ($status && $status !== 'all') {
        $baseQuery .= " AND ep.status = ?";
        $params[] = $status;
    }
    
    $baseQuery .= " ORDER BY ep.created_at DESC LIMIT " . (int)$limit . " OFFSET " . (int)$offset;
    
    $stmt = $db->prepare($baseQuery);
    $stmt->execute($params);
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $countQuery = "
        SELECT COUNT(*) as total FROM event_plans ep
        WHERE DATE(ep.created_at) BETWEEN ? AND ?
    ";
    
    $countParams = [$startDate, $endDate];
    
    if ($eventType && $eventType !== 'all') {
        $countQuery .= " AND ep.title LIKE ?";
        $countParams[] = "%$eventType%";
    }
    
    if ($venueId && $venueId !== 'all') {
        $countQuery .= " AND ep.venue_id = ?";
        $countParams[] = $venueId;
    }
    
    if ($status && $status !== 'all') {
        $countQuery .= " AND ep.status = ?";
        $countParams[] = $status;
    }
    
    $stmt = $db->prepare($countQuery);
    $stmt->execute($countParams);
    $totalCount = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    $formattedEvents = array();
    foreach ($events as $event) {
        $formattedEvents[] = array(
            'id' => $event['id'],
            'title' => $event['title'],
            'event_type' => $event['event_type'],
            'description' => $event['description'],
            'expected_participants' => $event['expected_participants'],
            'status' => $event['status'],
            'created_at' => $event['created_at'],
            'updated_at' => $event['updated_at'],
            'organizer' => array(
                'name' => $event['organizer_name'],
                'email' => $event['organizer_email'],
                'role' => $event['organizer_role']
            ),
            'venue' => array(
                'name' => $event['venue_name'],
                'capacity' => $event['venue_capacity']
            ),
            'utilization_rate' => $event['venue_capacity'] > 0 ? 
                round((1 / $event['venue_capacity']) * 100, 1) : 0
        );
    }
    
    $response = array(
        "success" => true,
        "data" => array(
            "events" => $formattedEvents,
            "pagination" => array(
                "total" => $totalCount,
                "limit" => (int)$limit,
                "offset" => (int)$offset,
                "pages" => ceil($totalCount / $limit)
            )
        ),
        "filters" => array(
            "start_date" => $startDate,
            "end_date" => $endDate,
            "event_type" => $eventType,
            "venue_id" => $venueId,
            "status" => $status
        )
    );
    
    http_response_code(200);
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "success" => false,
        "message" => "Error generating event reports: " . $e->getMessage()
    ));
}
?>
