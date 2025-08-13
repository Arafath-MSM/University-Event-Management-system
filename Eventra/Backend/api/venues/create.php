<?php
/**
 * Create Venue API Endpoint
 * Eventra ESRS Backend
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/Venue.php';
require_once '../../utils/JWTUtil.php';

// Get database connection
$database = new Database();
$db = $database->getConnection();

// Initialize venue object
$venue = new Venue($db);

// Get posted data
$data = json_decode(file_get_contents("php://input"));

if(!empty($data->name) && !empty($data->capacity) && !empty($data->location) && !empty($data->type)) {
    
    // Set venue property values
    $venue->name = $data->name;
    $venue->capacity = $data->capacity;
    $venue->location = $data->location;
    $venue->type = $data->type;
    $venue->availability = $data->availability ?? 'Available';
    $venue->restrictions = $data->restrictions ?? '';
    $venue->images = $data->images ?? [];
    
    // Create the venue
    if($venue_id = $venue->create()) {
        
        // Get the created venue data
        $venue->id = $venue_id;
        $venue->readOne();
        
        $venue_item = array(
            "id" => $venue->id,
            "name" => $venue->name,
            "capacity" => $venue->capacity,
            "location" => $venue->location,
            "type" => $venue->type,
            "availability" => $venue->availability,
            "restrictions" => $venue->restrictions,
            "images" => json_decode($venue->images, true),
            "created_at" => $venue->created_at,
            "updated_at" => $venue->updated_at
        );
        
        $response_data = array(
            "success" => true,
            "message" => "Venue created successfully",
            "venue" => $venue_item
        );
        
        // Set response code - 201 Created
        http_response_code(201);
        echo json_encode($response_data);
        
    } else {
        // Set response code - 503 Service unavailable
        http_response_code(503);
        echo json_encode(array(
            "success" => false,
            "message" => "Unable to create venue."
        ));
    }
    
} else {
    // Set response code - 400 Bad request
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => "Unable to create venue. Data is incomplete."
    ));
}
?> 