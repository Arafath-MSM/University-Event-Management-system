<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

require_once '../../config/database.php';
require_once '../../models/User.php';

// Create database connection
$database = new Database();
$db = $database->getConnection();

// Create user object
$user = new User($db);

// Get query parameters
$role = $_GET['role'] ?? null;
$search = $_GET['search'] ?? null;

try {
    // Read users with filters
    $result = $user->read($role, $search);
    
    if ($result) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Users retrieved successfully',
            'data' => $result
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'No users found'
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error retrieving users: ' . $e->getMessage()
    ]);
}
?> 