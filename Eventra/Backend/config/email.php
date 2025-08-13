<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../vendor/autoload.php';

define('USE_MOCK_EMAIL', false);

class EmailService {
    private $mailer;
    private $config;
    
    public function __construct() {
        $this->config = [
            'smtp_host' => 'smtp.gmail.com', 
            'smtp_port' => 587,
            'smtp_username' => 'msmarafath1@gmail.com', 
            'smtp_password' => 'uepo crop bvfb pxke', 
            'smtp_encryption' => 'tls',
            'from_email' => 'noreply@university.edu', 
            'from_name' => 'University Event Management System'
        ];
        
        $this->initializeMailer();
    }
    
    private function initializeMailer() {
        if (defined('USE_MOCK_EMAIL') && USE_MOCK_EMAIL) {
            $this->mailer = null;
            return;
        }
        
        if (class_exists('PHPMailer\PHPMailer\PHPMailer')) {
            $this->mailer = new PHPMailer(true);
            
            try {
                $this->mailer->isSMTP();
                $this->mailer->Host = $this->config['smtp_host'];
                $this->mailer->SMTPAuth = true;
                $this->mailer->Username = $this->config['smtp_username'];
                $this->mailer->Password = $this->config['smtp_password'];
                $this->mailer->SMTPSecure = $this->config['smtp_encryption'];
                $this->mailer->Port = $this->config['smtp_port'];
                
                $this->mailer->setFrom($this->config['from_email'], $this->config['from_name']);
                $this->mailer->isHTML(true);
                $this->mailer->CharSet = 'UTF-8';
                
            } catch (Exception $e) {
                error_log("Email service initialization failed: " . $e->getMessage());
                throw new Exception("Email service not available");
            }
        } else {
            error_log("PHPMailer class not found - using mock service");
            $this->mailer = null;
        }
    }
    
    public function sendEmailWithAttachments($toEmail, $subject, $body, $attachments = []) {
        if (defined('USE_MOCK_EMAIL') && USE_MOCK_EMAIL) {
            $logMessage = "MOCK EMAIL SENT:\n";
            $logMessage .= "To: $toEmail\n";
            $logMessage .= "Subject: $subject\n";
            $logMessage .= "Attachments: " . count($attachments) . "\n";
            
            foreach ($attachments as $attachment) {
                $logMessage .= "- " . ($attachment['file_name'] ?? basename($attachment['file_path'])) . "\n";
            }
            
            error_log($logMessage);
            
            return [
                'success' => true,
                'message' => 'Mock email logged successfully',
                'recipient' => $toEmail,
                'subject' => $subject,
                'attachments_count' => count($attachments),
                'mock_service' => true
            ];
        }
        
        if (!$this->mailer) {
            return [
                'success' => false,
                'message' => 'Email service not available'
            ];
        }
        
        try {
            $this->mailer->clearAddresses();
            $this->mailer->clearAttachments();
            
            $this->mailer->addAddress($toEmail);
            
            $this->mailer->Subject = $subject;
            $this->mailer->Body = $body;
            $this->mailer->AltBody = $this->stripHtml($body);
            
            foreach ($attachments as $attachment) {
                if (isset($attachment['file_path']) && file_exists($attachment['file_path'])) {
                    $this->mailer->addAttachment(
                        $attachment['file_path'], 
                        $attachment['file_name'] ?? basename($attachment['file_path'])
                    );
                }
            }
            
            $this->mailer->send();
            
            return [
                'success' => true,
                'message' => 'Email sent successfully',
                'recipient' => $toEmail,
                'subject' => $subject,
                'attachments_count' => count($attachments)
            ];
            
        } catch (Exception $e) {
            error_log("Email sending failed: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to send email: ' . $e->getMessage()
            ];
        }
    }
    
    public function sendSimpleEmail($toEmail, $subject, $body) {
        try {
            $this->mailer->clearAddresses();
            $this->mailer->clearAttachments();
            
            $this->mailer->addAddress($toEmail);
            
            $this->mailer->Subject = $subject;
            $this->mailer->Body = $body;
            $this->mailer->AltBody = $this->stripHtml($body);
            
            $this->mailer->send();
            
            return [
                'success' => true,
                'message' => 'Email sent successfully',
                'recipient' => $toEmail,
                'subject' => $subject
            ];
            
        } catch (Exception $e) {
            error_log("Email sending failed: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to send email: ' . $e->getMessage()
            ];
        }
    }
    
    private function stripHtml($html) {
        $text = strip_tags($html);
        $text = html_entity_decode($text, ENT_QUOTES, 'UTF-8');
        
        $text = preg_replace('/\s+/', ' ', $text);
        $text = trim($text);
        
        return $text;
    }
    
    public function testConnection() {
        if (defined('USE_MOCK_EMAIL') && USE_MOCK_EMAIL) {
            return [
                'success' => true,
                'message' => 'Mock email service active - no SMTP connection needed'
            ];
        }
        
        if (!$this->mailer) {
            return [
                'success' => false,
                'message' => 'Email service not available'
            ];
        }
        
        try {
            $this->mailer->smtpConnect();
            return [
                'success' => true,
                'message' => 'SMTP connection successful'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'SMTP connection failed: ' . $e->getMessage()
            ];
        }
    }
    
    public function updateConfig($newConfig) {
        $this->config = array_merge($this->config, $newConfig);
        $this->initializeMailer();
    }
}

$emailService = new EmailService();

if (defined('USE_MOCK_EMAIL') && USE_MOCK_EMAIL) {
    class MockEmailService extends EmailService {
        public function sendEmailWithAttachments($toEmail, $subject, $body, $attachments = []) {
            error_log("MOCK EMAIL - To: {$toEmail}, Subject: {$subject}, Attachments: " . count($attachments));
            
            return [
                'success' => true,
                'message' => 'Mock email logged successfully',
                'recipient' => $toEmail,
                'subject' => $subject,
                'attachments_count' => count($attachments),
                'mock' => true
            ];
        }
        
        public function sendSimpleEmail($toEmail, $subject, $body) {
            error_log("MOCK EMAIL - To: {$toEmail}, Subject: {$subject}");
            
            return [
                'success' => true,
                'message' => 'Mock email logged successfully',
                'recipient' => $toEmail,
                'subject' => $subject,
                'mock' => true
            ];
        }
    }
    
    $emailService = new MockEmailService();
}
?>
