<?php
/**
 * Create Venue API Endpoint
 * Eventra ESRS Backend
 */

require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/Venue.php';
require_once '../../utils/JWTUtil.php';

// Validate JWT token
$jwt = getBearerToken();
if (!$jwt || !JWTUtil::validateToken($jwt)) {
    http_response_code(401);
    echo json_encode(array(
        "success" => false,
        "message" => "Access denied. Invalid token."
    ));
    exit();
}

$database = new Database();
$db = $database->getConnection();

$venue = new Venue($db);

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->name) && !empty($data->capacity) && !empty($data->location) && !empty($data->type)) {
    
    $venue->name = htmlspecialchars(strip_tags($data->name));
    $venue->capacity = htmlspecialchars(strip_tags($data->capacity));
    $venue->location = htmlspecialchars(strip_tags($data->location));
    $venue->type = htmlspecialchars(strip_tags($data->type));
    $venue->availability = isset($data->availability) ? htmlspecialchars(strip_tags($data->availability)) : 'Available';
    $venue->restrictions = isset($data->restrictions) ? htmlspecialchars(strip_tags($data->restrictions)) : '';
    
    // Process images
    $images = [];
    if (isset($data->images) && is_array($data->images)) {
        foreach ($data->images as $image) {
            // Validate and sanitize image data
            if (filter_var($image, FILTER_VALIDATE_URL) || preg_match('/^data:image\/(png|jpeg|jpg|gif);base64,/', $image)) {
                $images[] = $image;
            }
        }
    }
    $images = [];
if (isset($data->images) && is_array($data->images)) {
    foreach ($data->images as $image) {
        if (filter_var($image, FILTER_VALIDATE_URL) || preg_match('/^data:image\/(png|jpeg|jpg|gif);base64,/', $image)) {
            $images[] = $image;
        }
    }
}
$venue->images = json_encode($images, JSON_UNESCAPED_SLASHES);
if ($venue->images === false) {
    $venue->images = '[]'; // fallback
}

    
    if($venue_id = $venue->create()) {
        
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
        
        http_response_code(201);
        echo json_encode($response_data);
        
    } else {
        http_response_code(503);
        echo json_encode(array(
            "success" => false,
            "message" => "Unable to create venue. Please try again."
        ));
    }
    
} else {
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => "Unable to create venue. Data is incomplete. Required fields: name, capacity, location, type."
    ));
}

// Function to get bearer token
function getBearerToken() {
    $headers = getAuthorizationHeader();
    if (!empty($headers)) {
        if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }
    }
    return null;
}

function getAuthorizationHeader() {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER['Authorization']);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    return $headers;
}
?>