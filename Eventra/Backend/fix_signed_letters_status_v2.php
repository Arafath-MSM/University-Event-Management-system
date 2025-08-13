<?php
echo "🔧 Fixing Signed Letters Status (Version 2)\n";
echo "===========================================\n\n";

require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "1. Fixing existing records with empty string status...\n";
    
    
    $updateQuery = "UPDATE signed_letters SET status = 'signed' WHERE event_plan_id = 20 AND (status = '' OR status IS NULL OR status = ' ')";
    $stmt = $db->prepare($updateQuery);
    $stmt->execute();
    $affectedRows = $stmt->rowCount();
    
    echo "   Updated {$affectedRows} records with empty status\n";
    
    echo "\n2. Checking current status values...\n";
    $checkQuery = "SELECT id, from_role, status, LENGTH(status) as status_length FROM signed_letters WHERE event_plan_id = 20";
    $stmt = $db->prepare($checkQuery);
    $stmt->execute();
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($records as $record) {
        $statusDisplay = $record['status'] === '' ? "EMPTY_STRING" : "'{$record['status']}'";
        echo "   ID {$record['id']} - {$record['from_role']}: status = {$statusDisplay} (length: {$record['status_length']})\n";
    }
    
    echo "\n3. Updating records individually...\n";
    
    $individualUpdateQuery = "UPDATE signed_letters SET status = 'signed' WHERE id = ?";
    $stmt = $db->prepare($individualUpdateQuery);
    
    $updatedCount = 0;
    foreach ($records as $record) {
        if ($record['status'] === '' || $record['status'] === null || $record['status'] === ' ') {
            $stmt->execute([$record['id']]);
            if ($stmt->rowCount() > 0) {
                $updatedCount++;
                echo "   ✅ Updated record ID {$record['id']} ({$record['from_role']})\n";
            }
        }
    }
    
    echo "   Total records updated: {$updatedCount}\n";
    
    echo "\n4. Verifying the fix...\n";
    
    $checkQuery = "SELECT id, from_role, status FROM signed_letters WHERE event_plan_id = 20";
    $stmt = $db->prepare($checkQuery);
    $stmt->execute();
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($records as $record) {
        $statusDisplay = $record['status'] === '' ? "EMPTY_STRING" : "'{$record['status']}'";
        echo "   ID {$record['id']} - {$record['from_role']}: status = {$statusDisplay}\n";
    }
    
    echo "\n5. Testing getSignedLetters query again...\n";
    
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
    $stmt->execute([20]);
    $testResults = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "   Results found: " . count($testResults) . "\n";
    
    if (count($testResults) > 0) {
        foreach ($testResults as $result) {
            echo "   ✅ Found: {$result['from_role']} - {$result['file_name']}\n";
        }
        echo "\n   🎉 Query now works! getSignedLetters() will find the records.\n";
    } else {
        echo "   ❌ Still no results found\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n🏁 Fix completed!\n";
echo "\n📋 Next Steps:\n";
echo "1. Try sending the signed letters again\n";
echo "2. The getSignedLetters() function should now find the records\n";
echo "3. Email should be sent with attachments\n";
?>
