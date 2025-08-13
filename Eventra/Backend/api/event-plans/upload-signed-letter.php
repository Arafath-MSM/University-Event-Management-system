<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../../config/database.php';

$database = new Database();
$conn = $database->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (!isset($_FILES['signedLetter']) || $_FILES['signedLetter']['error'] !== UPLOAD_ERR_OK) {
            throw new Exception('No file uploaded or upload error occurred');
        }

        $eventPlanId = $_POST['eventPlanId'] ?? null;
        $letterType = $_POST['letterType'] ?? null;
        $fromRole = $_POST['fromRole'] ?? null;

        if (!$eventPlanId || !$letterType || !$fromRole) {
            throw new Exception('Missing required fields: eventPlanId, letterType, or fromRole');
        }

        $file = $_FILES['signedLetter'];
        
        $allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        $fileInfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($fileInfo, $file['tmp_name']);
        finfo_close($fileInfo);

        if (!in_array($mimeType, $allowedTypes)) {
            throw new Exception('Invalid file type. Only PDF, DOC, and DOCX files are allowed.');
        }

        $uploadDir = '../../uploads/signed-letters';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = sprintf(
            '%s_%s_%s_%s.%s',
            $fromRole,
            $letterType,
            $eventPlanId,
            time(),
            $fileExtension
        );
        
        $filePath = $uploadDir . '/' . $fileName;
        $relativePath = 'uploads/signed-letters/' . $fileName;

        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            throw new Exception('Failed to save uploaded file');
        }

        $checkQuery = "SELECT id FROM signed_letters WHERE event_plan_id = ? AND from_role = ? AND letter_type = ?";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->execute([$eventPlanId, $fromRole, $letterType]);
        $existingLetter = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($existingLetter) {
            $updateQuery = "UPDATE signed_letters SET 
                file_path = ?, 
                file_name = ?, 
                status = 'signed',
                updated_at = NOW()
                WHERE id = ?";
            $updateStmt = $conn->prepare($updateQuery);
            $updateStmt->execute([$relativePath, $fileName, $existingLetter['id']]);
            
            $message = 'Signed letter updated successfully';
        } else {
            $insertQuery = "INSERT INTO signed_letters (
                event_plan_id, 
                from_role, 
                letter_type, 
                file_path, 
                file_name, 
                status, 
                created_at, 
                updated_at
            ) VALUES (?, ?, ?, ?, ?, 'signed', NOW(), NOW())";
            
            $insertStmt = $conn->prepare($insertQuery);
            $insertStmt->execute([
                $eventPlanId, 
                $fromRole, 
                $letterType, 
                $relativePath, 
                $fileName
            ]);
            
            $message = 'Signed letter uploaded successfully';
        }

        echo json_encode([
            'success' => true,
            'message' => $message,
            'file_path' => $relativePath,
            'file_name' => $fileName,
            'event_plan_id' => $eventPlanId,
            'from_role' => $fromRole,
            'letter_type' => $letterType
        ]);

    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}
?>
