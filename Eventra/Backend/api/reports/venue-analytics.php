<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/Venue.php';
require_once '../../models/EventPlan.php';
require_once '../../models/Booking.php';
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
$venueId = $_GET['venue_id'] ?? null;

try {
    $response = array();
    
    $overallStats = array();
    
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM venues");
    $stmt->execute();
    $overallStats['total_venues'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    $stmt = $db->prepare("SELECT SUM(capacity) as total FROM venues");
    $stmt->execute();
    $overallStats['total_capacity'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
    
    $venueUsageQuery = "
        SELECT 
            v.id,
            v.name,
            v.capacity,
            v.location,
            'General' as facilities,
            COUNT(ep.id) as event_count,
            COUNT(b.id) as booking_count,
            COUNT(ep.id) as total_participants,
            COUNT(ep.id) as avg_participants,
            COUNT(ep.id) as max_participants,
            COUNT(ep.id) as min_participants
        FROM venues v
        LEFT JOIN event_plans ep ON DATE(ep.created_at) BETWEEN ? AND ?
        LEFT JOIN bookings b ON v.id = b.venue_id AND DATE(b.created_at) BETWEEN ? AND ?
        GROUP BY v.id, v.name, v.capacity, v.location
        ORDER BY event_count DESC, event_count DESC
    ";
    
    $stmt = $db->prepare($venueUsageQuery);
    $stmt->execute([$startDate, $endDate, $startDate, $endDate]);
    $venueUsage = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($venueUsage as &$venue) {
        $venue['utilization_rate'] = $venue['capacity'] > 0 ? 
            round(($venue['total_participants'] / ($venue['capacity'] * $venue['event_count'])) * 100, 1) : 0;
        
        $venue['efficiency_score'] = $venue['event_count'] > 0 ? 
            round(($venue['total_participants'] / $venue['capacity']) * ($venue['event_count'] / 30), 2) : 0;
        
        $venue['avg_occupancy'] = $venue['capacity'] > 0 ? 
            round(($venue['avg_participants'] / $venue['capacity']) * 100, 1) : 0;
    }
    
    $performanceQuery = "
        SELECT 
            v.name,
            v.capacity,
            COUNT(ep.id) as events_held,
            COUNT(ep.id) as total_participants,
            ROUND(COUNT(ep.id), 1) as avg_participants,
            ROUND((COUNT(ep.id) / (v.capacity * COUNT(ep.id))) * 100, 1) as utilization_rate
        FROM venues v
        LEFT JOIN event_plans ep ON DATE(ep.created_at) BETWEEN ? AND ?
        WHERE ep.id IS NOT NULL
        GROUP BY v.id, v.name, v.capacity
        HAVING events_held > 0
        ORDER BY utilization_rate DESC, total_participants DESC
        LIMIT 10
    ";
    
    $stmt = $db->prepare($performanceQuery);
    $stmt->execute([$startDate, $endDate]);
    $topVenues = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $trendQuery = "
        SELECT 
            DATE_FORMAT(ep.created_at, '%Y-%m') as month,
            'All Venues' as venue_name,
            COUNT(ep.id) as event_count,
            COUNT(ep.id) as total_participants
        FROM event_plans ep
        WHERE ep.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(ep.created_at, '%Y-%m')
        ORDER BY month ASC, event_count DESC
    ";
    
    $stmt = $db->prepare($trendQuery);
    $stmt->execute();
    $monthlyTrends = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $categoryQuery = "
        SELECT 
            'General' as facilities,
            COUNT(DISTINCT v.id) as venue_count,
            COUNT(ep.id) as total_events,
            COUNT(ep.id) as total_participants,
            COUNT(ep.id) as avg_participants
        FROM venues v
        LEFT JOIN event_plans ep ON DATE(ep.created_at) BETWEEN ? AND ?
        GROUP BY facilities
        ORDER BY total_events DESC
    ";
    
    $stmt = $db->prepare($categoryQuery);
    $stmt->execute([$startDate, $endDate]);
    $categoryAnalysis = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $peakQuery = "
        SELECT 
            HOUR(ep.created_at) as hour,
            COUNT(ep.id) as event_count,
            COUNT(ep.id) as total_participants
        FROM event_plans ep
        WHERE DATE(ep.created_at) BETWEEN ? AND ?
        GROUP BY HOUR(ep.created_at)
        ORDER BY event_count DESC
        LIMIT 5
    ";
    
    $stmt = $db->prepare($peakQuery);
    $stmt->execute([$startDate, $endDate]);
    $peakHours = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $response = array(
        "success" => true,
        "data" => array(
            "overall_stats" => $overallStats,
            "venue_usage" => $venueUsage,
            "top_performing_venues" => $topVenues,
            "monthly_trends" => $monthlyTrends,
            "category_analysis" => $categoryAnalysis,
            "peak_usage_times" => $peakHours
        ),
        "filters" => array(
            "start_date" => $startDate,
            "end_date" => $endDate,
            "venue_id" => $venueId
        )
    );
    
    http_response_code(200);
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "success" => false,
        "message" => "Error generating venue analytics: " . $e->getMessage()
    ));
}
?>
