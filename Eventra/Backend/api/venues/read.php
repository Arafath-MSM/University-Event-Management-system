<?php
/**
 * Venues Read API Endpoint
 * Eventra ESRS Backend
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/Venue.php';

$database = new Database();
$db = $database->getConnection();

$venue = new Venue($db);

$search = $_GET['search'] ?? null;
$type = $_GET['type'] ?? null;
$min_capacity = $_GET['min_capacity'] ?? null;

try {
    $stmt = $venue->read($search, $type, $min_capacity);
    $venues = [];
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $venues[] = array(
            "id" => $row['id'],
            "name" => $row['name'],
            "capacity" => $row['capacity'],
            "location" => $row['location'],
            "type" => $row['type'],
            "availability" => $row['availability'],
            "restrictions" => $row['restrictions'],
            "images" => $row['images'],
            "created_at" => $row['created_at'],
            "updated_at" => $row['updated_at']
        );
    }
    
    http_response_code(200);
    echo json_encode(array(
        "success" => true,
        "message" => "Venues retrieved successfully",
        "data" => $venues
    ));
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "success" => false,
        "message" => "Unable to retrieve venues: " . $e->getMessage()
    ));
}
?> 