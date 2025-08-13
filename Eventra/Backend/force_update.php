<?php
require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "🔧 Force updating status field...\n\n";
    
    $recordIds = [32, 33, 34, 35, 36];
    
    foreach ($recordIds as $id) {
        $sql = "UPDATE signed_letters SET status = 'signed' WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute([$id]);
        $affected = $stmt->rowCount();
        
        if ($affected > 0) {
            echo "✅ Updated record ID {$id}\n";
        } else {
            echo "❌ Failed to update record ID {$id}\n";
        }
    }
    
    echo "\n🔍 Verifying the update...\n";
    
    $sql = "SELECT id, from_role, status FROM signed_letters WHERE event_plan_id = 20";
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($records as $record) {
        $statusDisplay = $record['status'] === '' ? "EMPTY" : ($record['status'] === null ? "NULL" : "'{$record['status']}'");
        echo "ID {$record['id']} - {$record['from_role']}: status = {$statusDisplay}\n";
    }
    
    echo "\n🎯 Testing getSignedLetters query...\n";
    
    $testQuery = "SELECT COUNT(*) as count FROM signed_letters WHERE event_plan_id = 20 AND letter_type = 'approval' AND status = 'signed'";
    $stmt = $db->prepare($testQuery);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "Records found: {$result['count']}\n";
    
    if ($result['count'] > 0) {
        echo "🎉 SUCCESS! Now try sending the signed letters again.\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
