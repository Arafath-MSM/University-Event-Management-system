<?php
require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $sql = "UPDATE signed_letters SET status = 'signed' WHERE event_plan_id = 20";
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $affected = $stmt->rowCount();
    
    echo "✅ Updated {$affected} records to status = 'signed'\n";
    
    $sql = "SELECT COUNT(*) as count FROM signed_letters WHERE event_plan_id = 20 AND status = 'signed'";
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "📊 Records with status = 'signed': {$result['count']}\n";
    
    if ($result['count'] > 0) {
        echo "🎉 Fix successful! Now try sending the signed letters again.\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
