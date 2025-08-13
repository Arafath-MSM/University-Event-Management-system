<?php
/**
 * Eventra ESRS Backend Setup Script
 * Run this script to initialize the database and test the API
 */

require_once 'config/database.php';
require_once 'models/User.php';
require_once 'models/Venue.php';
require_once 'models/Booking.php';

echo "=== Eventra ESRS Backend Setup ===\n\n";

echo "1. Testing database connection...\n";
try {
    $database = new Database();
    $db = $database->getConnection();
    echo "✓ Database connection successful\n\n";
} catch (Exception $e) {
    echo "✗ Database connection failed: " . $e->getMessage() . "\n";
    echo "Please check your database configuration in config/database.php\n";
    exit(1);
}

echo "2. Testing user model...\n";
try {
    $user = new User($db);
    $stmt = $user->read();
    $count = $stmt->rowCount();
    echo "✓ User model working - Found {$count} users\n\n";
} catch (Exception $e) {
    echo "✗ User model test failed: " . $e->getMessage() . "\n";
}

echo "3. Testing venue model...\n";
try {
    $venue = new Venue($db);
    $stmt = $venue->read();
    $count = $stmt->rowCount();
    echo "✓ Venue model working - Found {$count} venues\n\n";
} catch (Exception $e) {
    echo "✗ Venue model test failed: " . $e->getMessage() . "\n";
}

echo "4. Testing booking model...\n";
try {
    $booking = new Booking($db);
    $stmt = $booking->read();
    $count = $stmt->rowCount();
    echo "✓ Booking model working - Found {$count} bookings\n\n";
} catch (Exception $e) {
    echo "✗ Booking model test failed: " . $e->getMessage() . "\n";
}

echo "5. Testing API endpoints...\n";

$venues_url = "http://" . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . "/api/venues/read.php";
$venues_response = file_get_contents($venues_url);
if ($venues_response !== false) {
    $venues_data = json_decode($venues_response, true);
    if (isset($venues_data['records'])) {
        echo "✓ Venues API working - Found " . count($venues_data['records']) . " venues\n";
    } else {
        echo "✗ Venues API returned invalid response\n";
    }
} else {
    echo "✗ Venues API test failed\n";
}

$users_url = "http://" . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . "/api/users/read.php";
$users_response = file_get_contents($users_url);
if ($users_response !== false) {
    $users_data = json_decode($users_response, true);
    if (isset($users_data['records'])) {
        echo "✓ Users API working - Found " . count($users_data['records']) . " users\n";
    } else {
        echo "✗ Users API returned invalid response\n";
    }
} else {
    echo "✗ Users API test failed\n";
}

echo "\n=== Setup Complete ===\n\n";

echo "Sample Login Credentials:\n";
echo "Email: superadmin@university.edu\n";
echo "Password: password123\n";
echo "Role: super-admin\n\n";

echo "Other sample accounts:\n";
echo "- soundpro@university.edu (service-provider)\n";
echo "- vicechancellor@university.edu (vice-chancellor)\n";
echo "- amal@university.edu (student)\n";
echo "- fas@university.edu (faculty)\n\n";

echo "API Base URL: " . dirname($_SERVER['REQUEST_URI']) . "/api/\n";
echo "Database: eventra_esrs\n\n";

echo "Next steps:\n";
echo "1. Update your frontend to use the API endpoints\n";
echo "2. Test authentication with the sample accounts\n";
echo "3. Create additional users as needed\n";
echo "4. Configure your web server for production\n\n";
?> 