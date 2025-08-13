<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../../config/database.php';
require_once '../../config/email.php';

$database = new Database();
$conn = $database->getConnection();

class SignedLettersEmailService {
    private $conn;
    private $emailService;
    
    public function __construct($conn, $emailService) {
        $this->conn = $conn;
        $this->emailService = $emailService;
    }
    
    public function sendSignedLetters($eventPlanId, $userEmail, $eventTitle, $requesterName) {
        try {
            $signedLetters = $this->getSignedLetters($eventPlanId);
            
            if (empty($signedLetters)) {
                return [
                    'success' => false,
                    'message' => 'No signed letters found for this event plan. Please ensure all authorities have uploaded their signed letters.'
                ];
            }
            
            $emailSubject = "Event Plan Approved - Signed Letters: {$eventTitle}";
            $emailBody = $this->generateEmailBody($eventTitle, $requesterName, $signedLetters);
            
            $emailResult = $this->emailService->sendEmailWithAttachments(
                $userEmail,
                $emailSubject,
                $emailBody,
                $signedLetters
            );
            
            if ($emailResult['success']) {
                try {
                    $this->logEmailSent($eventPlanId, $userEmail, $signedLetters);
                } catch (Exception $e) {
                    error_log("Email logs table not available yet: " . $e->getMessage());
                }
                
                return [
                    'success' => true,
                    'message' => 'Signed letters sent successfully',
                    'email_details' => $emailResult
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to send email: ' . $emailResult['message']
                ];
            }
            
        } catch (Exception $e) {
            error_log("Error sending signed letters: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Internal server error while sending signed letters'
            ];
        }
    }
    
    private function getSignedLetters($eventPlanId) {
        $query = "SELECT 
                    sl.letter_content,
                    sl.letter_type,
                    sl.from_role,
                    sl.file_path,
                    sl.file_name
                  FROM signed_letters sl
                  WHERE sl.event_plan_id = ? 
                  AND sl.letter_type = 'approval'
                  AND sl.file_path IS NOT NULL 
                  AND sl.file_path != ''";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$eventPlanId]);
        
        $letters = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $letters[] = [
                'role' => $row['from_role'],
                'content' => $row['letter_content'],
                'file_path' => $row['file_path'],
                'file_name' => $row['file_name']
            ];
        }
        
        return $letters;
    }
    
    private function generateEmailBody($eventTitle, $requesterName, $signedLetters) {
        $body = "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; }
                .content { padding: 20px; }
                .footer { background-color: #f8f9fa; padding: 15px; border-radius: 5px; font-size: 12px; color: #666; }
                .letter-list { margin: 20px 0; }
                .letter-item { background-color: #e9ecef; padding: 10px; margin: 10px 0; border-radius: 3px; }
            </style>
        </head>
        <body>
            <div class='header'>
                <h2>🎉 Event Plan Approved!</h2>
                <p><strong>Event:</strong> {$eventTitle}</p>
                <p><strong>Requester:</strong> {$requesterName}</p>
            </div>
            
            <div class='content'>
                <p>Dear {$requesterName},</p>
                
                <p>Congratulations! Your event plan <strong>{$eventTitle}</strong> has been approved by all required authorities.</p>
                
                <p>The following signed approval letters are attached to this email:</p>
                
                <div class='letter-list'>";
        
        foreach ($signedLetters as $letter) {
            $roleName = $this->getRoleDisplayName($letter['role']);
            $body .= "
                    <div class='letter-item'>
                        <strong>✅ {$roleName} Approval Letter</strong><br>
                        Status: Approved and Signed
                    </div>";
        }
        
        $body .= "
                </div>
                
                <p><strong>Next Steps:</strong></p>
                <ul>
                    <li>Review all attached approval letters</li>
                    <li>Contact the Service Provider to coordinate event services</li>
                    <li>Ensure all requirements are met before the event date</li>
                    <li>Keep these approval letters for your records</li>
                </ul>
                
                <p>If you have any questions or need assistance, please contact the administration office.</p>
                
                <p>Best regards,<br>
                <strong>Event Management System</strong><br>
                University Administration</p>
            </div>
            
            <div class='footer'>
                <p>This is an automated message from the Event Management System. Please do not reply to this email.</p>
                <p>Generated on: " . date('F j, Y \a\t g:i A') . "</p>
            </div>
        </body>
        </html>";
        
        return $body;
    }
    
    private function getRoleDisplayName($role) {
        $roleNames = [
            'vice-chancellor' => 'Vice Chancellor',
            'warden' => 'Warden',
            'service-provider' => 'Service Provider',
            'administration' => 'University Administration'
        ];
        
        return $roleNames[$role] ?? ucfirst(str_replace('-', ' ', $role));
    }
    
    private function logEmailSent($eventPlanId, $userEmail, $signedLetters) {
        $query = "INSERT INTO email_logs (
                    event_plan_id, 
                    recipient_email, 
                    email_type, 
                    letters_sent, 
                    sent_at, 
                    status
                  ) VALUES (?, ?, 'signed_letters', ?, NOW(), 'sent')";
        
        $stmt = $this->conn->prepare($query);
        $lettersJson = json_encode($signedLetters);
        $stmt->execute([$eventPlanId, $userEmail, $lettersJson]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            throw new Exception('Invalid JSON input');
        }
        
        $requiredFields = ['eventPlanId', 'userEmail', 'eventTitle', 'requesterName'];
        foreach ($requiredFields as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                throw new Exception("Missing required field: {$field}");
            }
        }
        
        $eventPlanId = (int)$input['eventPlanId'];
        $userEmail = $input['userEmail'];
        $eventTitle = $input['eventTitle'];
        $requesterName = $input['requesterName'];
        
        if (!filter_var($userEmail, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Invalid email format');
        }
        
        $signedLettersService = new SignedLettersEmailService($conn, $emailService);
        
        $result = $signedLettersService->sendSignedLetters(
            $eventPlanId, 
            $userEmail, 
            $eventTitle, 
            $requesterName
        );
        
        echo json_encode($result);
        
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
