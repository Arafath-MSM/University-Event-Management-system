<?php
require_once __DIR__ . '/../config/email.php';

class PasswordResetEmailService {
    private $emailService;
    
    public function __construct() {
        global $emailService;
        $this->emailService = $emailService;
    }
    
    /**
     * Send password reset email
     */
    public function sendPasswordResetEmail($userEmail, $userName, $resetToken, $resetLink) {
        try {
            if (defined('USE_MOCK_EMAIL') && USE_MOCK_EMAIL) {
                error_log("=== MOCK PASSWORD RESET EMAIL ===");
                error_log("To: $userEmail");
                error_log("User: $userName");
                error_log("Reset Token: $resetToken");
                error_log("Reset Link: $resetLink");
                error_log("==================================");
                
                return true; 
            }
            
            $subject = "Password Reset Request - University Event Management System";
            $body = $this->generatePasswordResetEmailBody($userName, $resetLink, $resetToken);
            
            $result = $this->emailService->sendSimpleEmail($userEmail, $subject, $body);
            
            if ($result['success']) {
                error_log("Password reset email sent successfully to: $userEmail");
                return true;
            } else {
                error_log("Failed to send password reset email to: $userEmail - " . $result['message']);
                return false;
            }
            
        } catch (Exception $e) {
            error_log("Error sending password reset email: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Send password reset confirmation email
     */
    public function sendPasswordResetConfirmationEmail($userEmail, $userName) {
        try {
            if (defined('USE_MOCK_EMAIL') && USE_MOCK_EMAIL) {
                error_log("=== MOCK PASSWORD RESET CONFIRMATION EMAIL ===");
                error_log("To: $userEmail");
                error_log("User: $userName");
                error_log("=============================================");
                
                return true; 
            }
            
            $subject = "Password Reset Successful - University Event Management System";
            $body = $this->generatePasswordResetConfirmationEmailBody($userName);
            
            $result = $this->emailService->sendSimpleEmail($userEmail, $subject, $body);
            
            if ($result['success']) {
                error_log("Password reset confirmation email sent successfully to: $userEmail");
                return true;
            } else {
                error_log("Failed to send password reset confirmation email to: $userEmail - " . $result['message']);
                return false;
            }
            
        } catch (Exception $e) {
            error_log("Error sending password reset confirmation email: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Generate HTML body for password reset email
     */
    private function generatePasswordResetEmailBody($userName, $resetLink, $resetToken) {
        $expiryTime = date('Y-m-d H:i:s', strtotime('+1 hour'));
        
        return "
        <!DOCTYPE html>
        <html lang='en'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Password Reset Request</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
                .content { background: #f8f9fa; padding: 30px; }
                .button { display: inline-block; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { background: #ecf0f1; padding: 20px; text-align: center; font-size: 14px; color: #7f8c8d; }
                .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .token { background: #e8f4fd; border: 1px solid #bee5eb; padding: 10px; border-radius: 3px; font-family: monospace; word-break: break-all; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>🔐 Password Reset Request</h1>
                    <p>University Event Management System</p>
                </div>
                
                <div class='content'>
                    <p>Dear <strong>$userName</strong>,</p>
                    
                    <p>We received a request to reset your password for the University Event Management System. If you didn't make this request, you can safely ignore this email.</p>
                    
                    <p>To reset your password, click the button below:</p>
                    
                    <div style='text-align: center;'>
                        <a href='$resetLink' class='button'>Reset My Password</a>
                    </div>
                    
                    <p><strong>Or copy and paste this link into your browser:</strong></p>
                    <div class='token'>$resetLink</div>
                    
                    <div class='warning'>
                        <strong>⚠️ Important:</strong>
                        <ul>
                            <li>This link will expire in <strong>1 hour</strong> (at $expiryTime)</li>
                            <li>For security reasons, this link can only be used once</li>
                            <li>If you don't reset your password within 1 hour, you'll need to request a new link</li>
                        </ul>
                    </div>
                    
                    <p>If you have any questions or need assistance, please contact the system administrator.</p>
                    
                    <p>Best regards,<br>
                    <strong>University Event Management System Team</strong></p>
                </div>
                
                <div class='footer'>
                    <p>This is an automated message. Please do not reply to this email.</p>
                    <p>© " . date('Y') . " University Event Management System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>";
    }
    
    /**
     * Generate HTML body for password reset confirmation email
     */
    private function generatePasswordResetConfirmationEmailBody($userName) {
        return "
        <!DOCTYPE html>
        <html lang='en'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Password Reset Successful</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #27ae60; color: white; padding: 20px; text-align: center; }
                .content { background: #f8f9fa; padding: 30px; }
                .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .footer { background: #ecf0f1; padding: 20px; text-align: center; font-size: 14px; color: #7f8c8d; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>✅ Password Reset Successful</h1>
                    <p>University Event Management System</p>
                </div>
                
                <div class='content'>
                    <p>Dear <strong>$userName</strong>,</p>
                    
                    <div class='success'>
                        <h3>🎉 Your password has been successfully reset!</h3>
                        <p>You can now log in to the University Event Management System using your new password.</p>
                    </div>
                    
                    <p><strong>Next steps:</strong></p>
                    <ol>
                        <li>Go to the login page</li>
                        <li>Enter your email address and new password</li>
                        <li>Access your account and manage your events</li>
                    </ol>
                    
                    <p><strong>Security reminder:</strong></p>
                    <ul>
                        <li>Keep your password secure and don't share it with anyone</li>
                        <li>Consider using a strong, unique password</li>
                        <li>If you suspect any unauthorized access, contact the system administrator immediately</li>
                    </ul>
                    
                    <p>If you didn't reset your password or have any concerns, please contact the system administrator right away.</p>
                    
                    <p>Best regards,<br>
                    <strong>University Event Management System Team</strong></p>
                </div>
                
                <div class='footer'>
                    <p>This is an automated message. Please do not reply to this email.</p>
                    <p>© " . date('Y') . " University Event Management System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>";
    }
    
    /**
     * Test email service connection
     */
    public function testConnection() {
        try {
            $result = $this->emailService->testConnection();
            return $result;
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Connection test failed: ' . $e->getMessage()
            ];
        }
    }
}
?>
