<?php
echo "🔍 Checking Table Structure\n";
echo "==========================\n\n";

require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "1. Checking signed_letters table structure...\n";
    $query = "DESCRIBE signed_letters";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($columns as $column) {
        echo "   - {$column['Field']}: {$column['Type']} ({$column['Null']}) Default: '{$column['Default']}'\n";
    }
    
    echo "\n2. Checking current data for event plan 20...\n";
    $query = "SELECT * FROM signed_letters WHERE event_plan_id = 20";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($records as $record) {
        echo "   Record ID: {$record['id']}\n";
        echo "     Event Plan ID: {$record['event_plan_id']}\n";
        echo "     From Role: {$record['from_role']}\n";
        echo "     Letter Type: {$record['letter_type']}\n";
        echo "     Status: '{$record['status']}' (length: " . strlen($record['status']) . ")\n";
        echo "     File Path: {$record['file_path']}\n";
        echo "     File Name: {$record['file_name']}\n";
        echo "\n";
    }
    
    echo "3. Trying direct SQL update...\n";
    
    $directUpdateQuery = "UPDATE signed_letters SET status = 'signed' WHERE event_plan_id = 20 AND status = ''";
    $result = $db->exec($directUpdateQuery);
    
    if ($result !== false) {
        echo "   ✅ Direct update affected {$result} rows\n";
    } else {
        echo "   ❌ Direct update failed\n";
        
        $errorInfo = $db->errorInfo();
        echo "   Error info: " . print_r($errorInfo, true) . "\n";
    }
    
    echo "\n4. Verifying after update...\n";
    $query = "SELECT id, from_role, status FROM signed_letters WHERE event_plan_id = 20";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($records as $record) {
        $statusDisplay = $record['status'] === '' ? "EMPTY_STRING" : "'{$record['status']}'";
        echo "   ID {$record['id']} - {$record['from_role']}: status = {$statusDisplay}\n";
    }
    
    echo "\n5. Testing getSignedLetters query...\n";
    $testQuery = "SELECT COUNT(*) as count FROM signed_letters WHERE event_plan_id = 20 AND letter_type = 'approval' AND status = 'signed'";
    $stmt = $db->prepare($testQuery);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "   Records matching query: {$result['count']}\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n🏁 Check completed!\n";
?>
