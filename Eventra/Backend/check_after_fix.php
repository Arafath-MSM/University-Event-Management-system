<?php
require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "🔍 Checking records after fix...\n\n";
    
    $sql = "SELECT id, from_role, status, letter_type FROM signed_letters WHERE event_plan_id = 20";
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($records as $record) {
        $statusDisplay = $record['status'] === '' ? "EMPTY" : ($record['status'] === null ? "NULL" : "'{$record['status']}'");
        echo "ID {$record['id']} - {$record['from_role']}: status = {$statusDisplay}, type = {$record['letter_type']}\n";
    }
    
    echo "\n🔍 Testing the exact query from getSignedLetters...\n";
    
    $testQuery = "SELECT COUNT(*) as count FROM signed_letters WHERE event_plan_id = 20 AND letter_type = 'approval' AND status = 'signed'";
    $stmt = $db->prepare($testQuery);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "Query: {$testQuery}\n";
    echo "Result: {$result['count']} records found\n";
    
    if ($result['count'] == 0) {
        echo "\n❌ Still no results. Let me check each condition separately:\n";
        
        $sql1 = "SELECT COUNT(*) as count FROM signed_letters WHERE event_plan_id = 20";
        $stmt = $db->prepare($sql1);
        $stmt->execute();
        $result1 = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "event_plan_id = 20: {$result1['count']} records\n";
        
        $sql2 = "SELECT COUNT(*) as count FROM signed_letters WHERE event_plan_id = 20 AND letter_type = 'approval'";
        $stmt = $db->prepare($sql2);
        $stmt->execute();
        $result2 = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "event_plan_id = 20 AND letter_type = 'approval': {$result2['count']} records\n";
        
        $sql3 = "SELECT COUNT(*) as count FROM signed_letters WHERE event_plan_id = 20 AND letter_type = 'approval' AND status = 'signed'";
        $stmt = $db->prepare($sql3);
        $stmt->execute();
        $result3 = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "event_plan_id = 20 AND letter_type = 'approval' AND status = 'signed': {$result3['count']} records\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
