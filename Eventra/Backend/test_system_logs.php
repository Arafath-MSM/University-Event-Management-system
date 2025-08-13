<?php
header('Content-Type: application/json');

echo "🧪 Testing System Logs Functionality\n";
echo "=====================================\n\n";

// Test 1: Check if database connection works
echo "1. Testing database connection...\n";
try {
    require_once 'config/database.php';
    $database = new Database();
    $conn = $database->getConnection();
    echo "✅ Database connection successful\n\n";
} catch (Exception $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n\n";
    exit;
}

// Test 2: Check if activity_logs table exists
echo "2. Checking if activity_logs table exists...\n";
try {
    $stmt = $conn->prepare("SHOW TABLES LIKE 'activity_logs'");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result) {
        echo "✅ activity_logs table exists\n\n";
    } else {
        echo "❌ activity_logs table does not exist\n";
        echo "   Creating table...\n";
        
        $createTable = "
        CREATE TABLE IF NOT EXISTS activity_logs (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NULL,
            action VARCHAR(255) NOT NULL,
            details TEXT,
            type ENUM('booking', 'event_plan', 'venue', 'user', 'system') NOT NULL,
            target_id INT NULL,
            target_type VARCHAR(50) NULL,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_user_id (user_id),
            INDEX idx_type (type),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        
        $conn->exec($createTable);
        echo "✅ activity_logs table created successfully\n\n";
    }
} catch (Exception $e) {
    echo "❌ Error checking/creating table: " . $e->getMessage() . "\n\n";
    exit;
}

// Test 3: Check table structure
echo "3. Checking table structure...\n";
try {
    $stmt = $conn->prepare("DESCRIBE activity_logs");
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "✅ Table structure:\n";
    foreach ($columns as $column) {
        echo "   - {$column['Field']}: {$column['Type']} ({$column['Null']})\n";
    }
    echo "\n";
} catch (Exception $e) {
    echo "❌ Error checking table structure: " . $e->getMessage() . "\n\n";
}

// Test 4: Check if table has data
echo "4. Checking if table has data...\n";
try {
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM activity_logs");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $count = $result['count'];
    
    if ($count > 0) {
        echo "✅ Table has {$count} records\n\n";
    } else {
        echo "⚠️  Table is empty. Inserting sample data...\n";
        
        // Insert sample data
        $sampleData = [
            ['user_login', 'User logged in: test@example.com', 'user', 1, 'user', '192.168.1.100', 'Test Browser'],
            ['booking_created', 'New booking created: Test Event', 'booking', 1, 'booking', '192.168.1.101', 'Test Browser'],
            ['system_maintenance', 'System check completed', 'system', NULL, NULL, '192.168.1.1', 'System Process']
        ];
        
        $insertStmt = $conn->prepare("
            INSERT INTO activity_logs (action, details, type, target_id, target_type, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        foreach ($sampleData as $data) {
            $insertStmt->execute($data);
        }
        
        echo "✅ Sample data inserted successfully\n\n";
    }
} catch (Exception $e) {
    echo "❌ Error checking/inserting data: " . $e->getMessage() . "\n\n";
}

// Test 5: Test the actual API query
echo "5. Testing API query...\n";
try {
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
        ORDER BY al.created_at DESC 
        LIMIT 10
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "✅ Query executed successfully\n";
    echo "   Found " . count($logs) . " records\n\n";
    
    // Show first few records
    if (count($logs) > 0) {
        echo "Sample records:\n";
        foreach (array_slice($logs, 0, 3) as $log) {
            echo "   - ID: {$log['id']}, Action: {$log['action']}, Type: {$log['type']}\n";
        }
        echo "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error executing query: " . $e->getMessage() . "\n\n";
}

echo "🏁 Testing completed!\n\n";
echo "📋 Next Steps:\n";
echo "1. Test the API endpoint: http://localhost/Eventra-ESRS/Eventra/Backend/api/system-logs/get-system-logs.php\n";
echo "2. Check the frontend System Logs tab\n";
echo "3. Verify filtering and real-time updates work\n";
?>
