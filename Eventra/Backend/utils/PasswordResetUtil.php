<?php
/**
 * Password Reset Utility Class
 * Provides helper functions for password reset operations
 */

class PasswordResetUtil {
    
    /**
     * Generate a secure random token
     * @param int $length Token length in bytes (default: 32)
     * @return string Hexadecimal token
     */
    public static function generateToken($length = 32) {
        return bin2hex(random_bytes($length));
    }
    
    /**
     * Generate a human-readable token (for email display)
     * @param int $length Token length (default: 8)
     * @return string Human-readable token
     */
    public static function generateReadableToken($length = 8) {
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $token = '';
        
        for ($i = 0; $i < $length; $i++) {
            $token .= $chars[rand(0, strlen($chars) - 1)];
        }
        
        return $token;
    }
    
    /**
     * Check if password meets security requirements
     * @param string $password Password to validate
     * @return array Validation result with success and message
     */
    public static function validatePassword($password) {
        $errors = [];
        
        if (strlen($password) < 8) {
            $errors[] = "Password must be at least 8 characters long";
        }
        
        if (!preg_match('/[A-Z]/', $password)) {
            $errors[] = "Password must contain at least one uppercase letter";
        }
        
        if (!preg_match('/[a-z]/', $password)) {
            $errors[] = "Password must contain at least one lowercase letter";
        }
        
        if (!preg_match('/[0-9]/', $password)) {
            $errors[] = "Password must contain at least one number";
        }
        
        if (!preg_match('/[^A-Za-z0-9]/', $password)) {
            $errors[] = "Password must contain at least one special character";
        }
        
        if (empty($errors)) {
            return [
                'success' => true,
                'message' => 'Password meets all requirements'
            ];
        }
        
        return [
            'success' => false,
            'message' => implode(', ', $errors)
        ];
    }
    
    /**
     * Clean up expired tokens from database
     * @param PDO $db Database connection
     * @return int Number of tokens cleaned up
     */
    public static function cleanupExpiredTokens($db) {
        try {
            $query = "DELETE FROM password_reset_tokens WHERE expires_at < NOW()";
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            return $stmt->rowCount();
        } catch (Exception $e) {
            error_log("Failed to cleanup expired tokens: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Check if user has too many active reset requests
     * @param PDO $db Database connection
     * @param int $userId User ID
     * @param int $maxRequests Maximum allowed requests (default: 3)
     * @param int $timeWindow Time window in hours (default: 24)
     * @return bool True if user has too many requests
     */
    public static function hasTooManyRequests($db, $userId, $maxRequests = 3, $timeWindow = 24) {
        try {
            $query = "
                SELECT COUNT(*) as count 
                FROM password_reset_tokens 
                WHERE user_id = ? 
                AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
                AND used = 0
            ";
            
            $stmt = $db->prepare($query);
            $stmt->execute([$userId, $timeWindow]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $result['count'] >= $maxRequests;
        } catch (Exception $e) {
            error_log("Failed to check reset request count: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get reset token expiry time
     * @param int $hours Hours until expiry (default: 1)
     * @return string MySQL datetime string
     */
    public static function getExpiryTime($hours = 1) {
        return date('Y-m-d H:i:s', strtotime("+{$hours} hours"));
    }
    
    /**
     * Format expiry time for display
     * @param string $expiryTime MySQL datetime string
     * @return string Formatted time string
     */
    public static function formatExpiryTime($expiryTime) {
        $timestamp = strtotime($expiryTime);
        $now = time();
        $diff = $timestamp - $now;
        
        if ($diff <= 0) {
            return 'Expired';
        }
        
        $hours = floor($diff / 3600);
        $minutes = floor(($diff % 3600) / 60);
        
        if ($hours > 0) {
            return "{$hours}h {$minutes}m remaining";
        } else {
            return "{$minutes}m remaining";
        }
    }
}
?>
