<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/User.php';
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
$userRole = $_GET['user_role'] ?? null;

try {
    $response = array();
    
    $overallStats = array();
    
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM users");
    $stmt->execute();
    $overallStats['total_users'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM users WHERE status = 'active'");
    $stmt->execute();
    $overallStats['active_users'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM users WHERE DATE(created_at) BETWEEN ? AND ?");
    $stmt->execute([$startDate, $endDate]);
    $overallStats['new_users'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    $roleQuery = "SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC";
    $stmt = $db->prepare($roleQuery);
    $stmt->execute();
    $overallStats['role_distribution'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $activityQuery = "
        SELECT 
            u.id,
            u.name,
            u.email,
            u.role,
            u.status,
            u.created_at,
            COUNT(DISTINCT ep.id) as event_plans_created,
            COUNT(DISTINCT b.id) as bookings_made,
            COUNT(ep.id) as total_participants_managed,
            MAX(ep.created_at) as last_event_activity,
            MAX(b.created_at) as last_booking_activity
        FROM users u
        LEFT JOIN event_plans ep ON u.id = ep.user_id AND DATE(ep.created_at) BETWEEN ? AND ?
        LEFT JOIN bookings b ON u.id = b.user_id AND DATE(b.created_at) BETWEEN ? AND ?
        GROUP BY u.id, u.name, u.email, u.role, u.status, u.created_at
        ORDER BY event_plans_created DESC, bookings_made DESC
    ";
    
    $stmt = $db->prepare($activityQuery);
    $stmt->execute([$startDate, $endDate, $startDate, $endDate]);
    $userActivity = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($userActivity as &$user) {
        $user['activity_score'] = ($user['event_plans_created'] * 10) + ($user['bookings_made'] * 5);
        $user['engagement_level'] = $user['activity_score'] >= 50 ? 'High' : ($user['activity_score'] >= 20 ? 'Medium' : 'Low');
        $user['days_since_created'] = round((time() - strtotime($user['created_at'])) / (24 * 60 * 60));
    }
    
    $topUsersQuery = "
        SELECT 
            u.name,
            u.role,
            COUNT(ep.id) as events_created,
            COUNT(b.id) as bookings_made,
            COUNT(ep.id) as total_participants
        FROM users u
        LEFT JOIN event_plans ep ON u.id = ep.user_id AND DATE(ep.created_at) BETWEEN ? AND ?
        LEFT JOIN bookings b ON u.id = b.user_id AND DATE(b.created_at) BETWEEN ? AND ?
        GROUP BY u.id, u.name, u.role
        HAVING events_created > 0 OR bookings_made > 0
        ORDER BY events_created DESC, total_participants DESC
        LIMIT 15
    ";
    
    $stmt = $db->prepare($topUsersQuery);
    $stmt->execute([$startDate, $endDate, $startDate, $endDate]);
    $topUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $growthQuery = "
        SELECT 
            DATE_FORMAT(created_at, '%Y-%m') as month,
            COUNT(*) as new_users,
            role
        FROM users 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m'), role
        ORDER BY month ASC, new_users DESC
    ";
    
    $stmt = $db->prepare($growthQuery);
    $stmt->execute();
    $userGrowth = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $engagementQuery = "
        SELECT 
            u.role,
            COUNT(DISTINCT u.id) as total_users,
            COUNT(DISTINCT ep.id) as total_events,
            COUNT(DISTINCT b.id) as total_bookings,
            ROUND(COUNT(ep.id), 1) as avg_participants_per_event,
            ROUND(COUNT(DISTINCT ep.id) / COUNT(DISTINCT u.id), 2) as events_per_user
        FROM users u
        LEFT JOIN event_plans ep ON u.id = ep.user_id AND DATE(ep.created_at) BETWEEN ? AND ?
        LEFT JOIN bookings b ON u.id = b.user_id AND DATE(b.created_at) BETWEEN ? AND ?
        GROUP BY u.role
        ORDER BY total_events DESC
    ";
    
    $stmt = $db->prepare($engagementQuery);
    $stmt->execute([$startDate, $endDate, $startDate, $endDate]);
    $roleEngagement = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $statusQuery = "
        SELECT 
            status,
            COUNT(*) as user_count,
            ROUND((COUNT(*) / (SELECT COUNT(*) FROM users)) * 100, 1) as percentage
        FROM users 
        GROUP BY status
        ORDER BY user_count DESC
    ";
    
    $stmt = $db->prepare($statusQuery);
    $stmt->execute();
    $statusAnalysis = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $facultyQuery = "
        SELECT 
            faculty,
            COUNT(*) as user_count,
            COUNT(DISTINCT ep.id) as events_created,
            COUNT(ep.id) as total_participants
        FROM users u
        LEFT JOIN event_plans ep ON u.id = ep.user_id AND DATE(ep.created_at) BETWEEN ? AND ?
        WHERE u.faculty IS NOT NULL AND u.faculty != ''
        GROUP BY u.faculty
        ORDER BY events_created DESC
        LIMIT 10
    ";
    
    $stmt = $db->prepare($facultyQuery);
    $stmt->execute([$startDate, $endDate]);
    $facultyAnalysis = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $response = array(
        "success" => true,
        "data" => array(
            "overall_stats" => $overallStats,
            "user_activity" => $userActivity,
            "top_active_users" => $topUsers,
            "user_growth_trends" => $userGrowth,
            "role_engagement" => $roleEngagement,
            "status_analysis" => $statusAnalysis,
            "faculty_analysis" => $facultyAnalysis
        ),
        "filters" => array(
            "start_date" => $startDate,
            "end_date" => $endDate,
            "user_role" => $userRole
        )
    );
    
    http_response_code(200);
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "success" => false,
        "message" => "Error generating user analytics: " . $e->getMessage()
    ));
}
?>
