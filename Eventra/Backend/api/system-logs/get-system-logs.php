<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../../config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $type = isset($_GET['type']) ? $_GET['type'] : null;
    $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
    $start_date = isset($_GET['start_date']) ? $_GET['start_date'] : null;
    $end_date = isset($_GET['end_date']) ? $_GET['end_date'] : null;
    
    $query = "
        SELECT 
            al.id,
            al.action,
            al.details,
            al.type,
            al.target_id,
            al.target_type,
            al.ip_address,
            al.created_at,
            u.name as user_name,
            u.email as user_email,
            u.role as user_role
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE 1=1
    ";
    
    $params = [];
    
    if ($type) {
        $query .= " AND al.type = ?";
        $params[] = $type;
    }
    
    if ($user_id) {
        $query .= " AND al.user_id = ?";
        $params[] = $user_id;
    }
    
    if ($start_date) {
        $query .= " AND DATE(al.created_at) >= ?";
        $params[] = $start_date;
    }
    
    if ($end_date) {
        $query .= " AND DATE(al.created_at) <= ?";
        $params[] = $end_date;
    }
    
    $query .= " ORDER BY al.created_at DESC LIMIT " . (int)$limit;
    
    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $formattedLogs = array_map(function($log) {
        return [
            'id' => $log['id'],
            'timestamp' => date('M j, Y g:i A', strtotime($log['created_at'])),
            'user' => $log['user_name'] ?: 'System',
            'action' => ucfirst(str_replace('_', ' ', $log['action'])),
            'target' => $log['target_type'] ? ucfirst(str_replace('_', ' ', $log['target_type'])) : 'N/A',
            'details' => $log['details'] ?: 'No additional details',
            'type' => ucfirst(str_replace('_', ' ', $log['type'])),
            'ip_address' => $log['ip_address'],
            'user_role' => $log['user_role'] ?: 'System',
            'raw_timestamp' => $log['created_at']
        ];
    }, $logs);
    
    $countQuery = "SELECT COUNT(*) as total FROM activity_logs";
    $countStmt = $conn->prepare($countQuery);
    $countStmt->execute();
    $totalCount = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    echo json_encode([
        'success' => true,
        'data' => $formattedLogs,
        'total' => $totalCount,
        'limit' => $limit,
        'message' => 'System logs retrieved successfully'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error retrieving system logs: ' . $e->getMessage()
    ]);
}
?>
