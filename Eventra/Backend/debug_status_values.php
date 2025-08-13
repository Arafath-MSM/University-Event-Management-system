<?php
echo "🔍 Debugging Status Values in Detail\n";
echo "====================================\n\n";

require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "1. Checking status values with detailed analysis...\n";
    
    $query = "SELECT id, from_role, status, 
                     LENGTH(status) as status_length,
                     status IS NULL as is_null,
                     status = '' as is_empty_string,
                     status = 'signed' as is_signed,
                     HEX(status) as status_hex
              FROM signed_letters 
              WHERE event_plan_id = 20";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($records as $record) {
        echo "   Record ID: {$record['id']} - {$record['from_role']}\n";
        echo "     Status: '{$record['status']}'\n";
        echo "     Length: {$record['status_length']}\n";
        echo "     IS NULL: " . ($record['is_null'] ? 'YES' : 'NO') . "\n";
        echo "     IS EMPTY: " . ($record['is_empty_string'] ? 'YES' : 'NO') . "\n";
        echo "     IS SIGNED: " . ($record['is_signed'] ? 'YES' : 'NO') . "\n";
        echo "     HEX: {$record['status_hex']}\n";
        echo "\n";
    }
    
    echo "2. Trying different update approaches...\n";
    
    echo "   Approach 1: Updating empty strings...\n";
    $update1 = "UPDATE signed_letters SET status = 'signed' WHERE event_plan_id = 20 AND status = ''";
    $stmt = $db->prepare($update1);
    $stmt->execute();
    $affected1 = $stmt->rowCount();
    echo "     Updated {$affected1} records\n";
    
    echo "   Approach 2: Updating NULL values...\n";
    $update2 = "UPDATE signed_letters SET status = 'signed' WHERE event_plan_id = 20 AND status IS NULL";
    $stmt = $db->prepare($update2);
    $stmt->execute();
    $affected2 = $stmt->rowCount();
    echo "     Updated {$affected2} records\n";
    
    echo "   Approach 3: Updating both empty and NULL...\n";
    $update3 = "UPDATE signed_letters SET status = 'signed' WHERE event_plan_id = 20 AND (status = '' OR status IS NULL)";
    $stmt = $db->prepare($update3);
    $stmt->execute();
    $affected3 = $stmt->rowCount();
    echo "     Updated {$affected3} records\n";
    
    echo "\n3. Verifying after all updates...\n";
    
    $checkQuery = "SELECT id, from_role, status FROM signed_letters WHERE event_plan_id = 20";
    $stmt = $db->prepare($checkQuery);
    $stmt->execute();
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($records as $record) {
        $statusDisplay = $record['status'] === '' ? "EMPTY_STRING" : "'{$record['status']}'";
        echo "   ID {$record['id']} - {$record['from_role']}: status = {$statusDisplay}\n";
    }
    
    echo "\n4. Testing getSignedLetters query...\n";
    
    $testQuery = "SELECT COUNT(*) as count FROM signed_letters WHERE event_plan_id = 20 AND letter_type = 'approval' AND status = 'signed'";
    $stmt = $db->prepare($testQuery);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "   Records matching query: {$result['count']}\n";
    
    if ($result['count'] > 0) {
        echo "   🎉 Success! Now testing the full query...\n";
        
        $fullQuery = "SELECT from_role, file_name FROM signed_letters WHERE event_plan_id = 20 AND letter_type = 'approval' AND status = 'signed'";
        $stmt = $db->prepare($fullQuery);
        $stmt->execute();
        $allResults = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($allResults as $result) {
            echo "     ✅ {$result['from_role']}: {$result['file_name']}\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n🏁 Debug completed!\n";
?>
