<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/EventPlan.php';
require_once '../../models/Booking.php';
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

$startDate = $_GET['start_date'] ?? date('Y-m-01'); // Default to first day of current month
$endDate = $_GET['end_date'] ?? date('Y-m-t'); // Default to last day of current month
$eventType = $_GET['event_type'] ?? null;
$venueId = $_GET['venue_id'] ?? null;

try {
    $response = array();
    
    $overallStats = array();
    
    $query = "SELECT COUNT(*) as total FROM event_plans WHERE DATE(created_at) BETWEEN ? AND ?";
    $params = [$startDate, $endDate];
    
    if ($eventType && $eventType !== 'all') {
        $query .= " AND title LIKE ?";
        $params[] = "%$eventType%";
    }
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $overallStats['total_events'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    $query = "SELECT COUNT(*) as total FROM bookings WHERE DATE(created_at) BETWEEN ? AND ?";
    $params = [$startDate, $endDate];
    
    if ($venueId && $venueId !== 'all') {
        $query .= " AND venue_id = ?";
        $params[] = $venueId;
    }
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $overallStats['total_bookings'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    $query = "SELECT SUM(participants) as total FROM event_plans WHERE DATE(created_at) BETWEEN ? AND ?";
    $params = [$startDate, $endDate];
    
    if ($eventType && $eventType !== 'all') {
        $query .= " AND title LIKE ?";
        $params[] = "%$eventType%";
    }
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $overallStats['total_participants'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
    
    $overallStats['avg_participants'] = $overallStats['total_events'] > 0 ? 
        round($overallStats['total_participants'] / $overallStats['total_events'], 1) : 0;
    
    $statusQuery = "SELECT status, COUNT(*) as count FROM event_plans WHERE DATE(created_at) BETWEEN ? AND ?";
    $params = [$startDate, $endDate];
    
    if ($eventType && $eventType !== 'all') {
        $statusQuery .= " AND title LIKE ?";
        $params[] = "%$eventType%";
    }
    
    $statusQuery .= " GROUP BY status";
    $stmt = $db->prepare($statusQuery);
    $stmt->execute($params);
    $overallStats['status_distribution'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $typeQuery = "SELECT ep.type as event_type, COUNT(*) as count FROM event_plans ep WHERE DATE(ep.created_at) BETWEEN ? AND ?";
    $params = [$startDate, $endDate];
    
    if ($venueId && $venueId !== 'all') {
        $typeQuery .= " AND ep.type LIKE ?";
        $params[] = "%$venueId%";
    }
    
    $typeQuery .= " GROUP BY ep.type";
    $stmt = $db->prepare($typeQuery);
    $stmt->execute($params);
    $overallStats['type_distribution'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $typeQuery = "
        SELECT 
            ep.type as event_type,
            COUNT(*) as count
        FROM event_plans ep
        WHERE DATE(ep.created_at) BETWEEN ? AND ?
        GROUP BY ep.type
        ORDER BY count DESC
    ";
    
    $stmt = $db->prepare($typeQuery);
    $stmt->execute([$startDate, $endDate]);
    $overallStats['type_distribution'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $trendQuery = "
        SELECT 
            DATE_FORMAT(created_at, '%Y-%m') as month,
            COUNT(*) as event_count,
            SUM(participants) as total_participants
        FROM event_plans 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC
    ";
    
    $stmt = $db->prepare($trendQuery);
    $stmt->execute();
    $overallStats['monthly_trend'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $topEventsQuery = "
        SELECT 
            title,
            type as event_type,
            participants as expected_participants,
            status,
            created_at
        FROM event_plans 
        WHERE DATE(created_at) BETWEEN ? AND ?
        ORDER BY participants DESC
        LIMIT 10
    ";
    
    $params = [$startDate, $endDate];
    if ($eventType && $eventType !== 'all') {
        $topEventsQuery .= " AND title LIKE ?";
        $params[] = "%$eventType%";
    }
    
    $stmt = $db->prepare($topEventsQuery);
    $stmt->execute($params);
    $overallStats['top_events'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $approvalQuery = "
        SELECT 
            'pending' as status,
            COUNT(*) as count
        FROM event_plans 
        WHERE status = 'pending' AND DATE(created_at) BETWEEN ? AND ?
        UNION ALL
        SELECT 
            'approved' as status,
            COUNT(*) as count
        FROM event_plans 
        WHERE status = 'approved' AND DATE(created_at) BETWEEN ? AND ?
        UNION ALL
        SELECT 
            'rejected' as status,
            COUNT(*) as count
        FROM event_plans 
        WHERE status = 'rejected' AND DATE(created_at) BETWEEN ? AND ?
    ";
    
    $stmt = $db->prepare($approvalQuery);
    $stmt->execute([$startDate, $endDate, $startDate, $endDate, $startDate, $endDate]);
    $overallStats['approval_stats'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $response = array(
        "success" => true,
        "data" => $overallStats,
        "filters" => array(
            "start_date" => $startDate,
            "end_date" => $endDate,
            "event_type" => $eventType,
            "venue_id" => $venueId
        )
    );
    
    http_response_code(200);
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "success" => false,
        "message" => "Error generating statistics: " . $e->getMessage()
    ));
}
?>
