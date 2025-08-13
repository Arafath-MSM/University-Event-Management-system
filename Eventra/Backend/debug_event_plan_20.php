<?php
echo "🔍 Debugging Event Plan 20 Signed Letters\n";
echo "=========================================\n\n";

require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $eventPlanId = 20;
    
    echo "1. Checking all records for event plan {$eventPlanId}...\n";
    $query = "SELECT * FROM signed_letters WHERE event_plan_id = ?";
    $stmt = $db->prepare($query);
    $stmt->execute([$eventPlanId]);
    $allRecords = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "   Total records found: " . count($allRecords) . "\n\n";
    
    if (count($allRecords) > 0) {
        foreach ($allRecords as $record) {
            echo "   Record ID: {$record['id']}\n";
            echo "     Event Plan ID: {$record['event_plan_id']}\n";
            echo "     From Role: {$record['from_role']}\n";
            echo "     Letter Type: {$record['letter_type']}\n";
            echo "     Status: {$record['status']}\n";
            echo "     File Path: {$record['file_path']}\n";
            echo "     File Name: {$record['file_name']}\n";
            echo "     Created: {$record['created_at']}\n";
            echo "     Updated: {$record['updated_at']}\n";
            echo "\n";
        }
    }
    
    echo "2. Testing getSignedLetters query logic...\n";
    
    $testQuery = "SELECT 
                    sl.letter_content,
                    sl.letter_type,
                    sl.from_role,
                    sl.file_path,
                    sl.file_name
                  FROM signed_letters sl
                  WHERE sl.event_plan_id = ? 
                  AND sl.letter_type = 'approval'
                  AND sl.status = 'signed'";
    
    $stmt = $db->prepare($testQuery);
    $stmt->execute([$eventPlanId]);
    $testResults = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "   Query: {$testQuery}\n";
    echo "   Parameters: event_plan_id = {$eventPlanId}\n";
    echo "   Results found: " . count($testResults) . "\n\n";
    
    if (count($testResults) > 0) {
        foreach ($testResults as $result) {
            echo "   ✅ Found: {$result['from_role']} - {$result['file_name']}\n";
        }
    } else {
        echo "   ❌ No results found with current query\n";
        
        echo "\n3. Checking actual values in table...\n";
        
        $checkQuery = "SELECT DISTINCT letter_type, status FROM signed_letters WHERE event_plan_id = ?";
        $stmt = $db->prepare($checkQuery);
        $stmt->execute([$eventPlanId]);
        $distinctValues = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "   Distinct letter_type values:\n";
        foreach ($distinctValues as $value) {
            echo "     - letter_type: '{$value['letter_type']}'\n";
        }
        
        echo "   Distinct status values:\n";
        foreach ($distinctValues as $value) {
            echo "     - status: '{$value['status']}'\n";
        }
    }
    
    echo "\n4. Checking if files exist on disk...\n";
    foreach ($allRecords as $record) {
        if (!empty($record['file_path'])) {
            $fullPath = __DIR__ . '/../' . $record['file_path'];
            if (file_exists($fullPath)) {
                echo "   ✅ File exists: {$record['file_name']}\n";
            } else {
                echo "   ❌ File missing: {$record['file_name']} (Path: {$fullPath})\n";
            }
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n🏁 Debug completed!\n";
?>
