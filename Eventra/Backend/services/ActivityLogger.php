<?php
require_once __DIR__ . '/../config/database.php';

class ActivityLogger {
    private $conn;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    /**
     * Log an activity
     * 
     * @param string $action The action performed
     * @param string $type The type of activity (booking, event_plan, venue, user, system)
     * @param int|null $userId The user who performed the action
     * @param int|null $targetId The ID of the target object
     * @param string|null $targetType The type of the target object
     * @param string|null $details Additional details about the action
     * @param string|null $ipAddress IP address of the user
     * @param string|null $userAgent User agent string
     * @return bool Success status
     */
    public function log($action, $type, $userId = null, $targetId = null, $targetType = null, $details = null, $ipAddress = null, $userAgent = null) {
        try {
            if (!$ipAddress) {
                $ipAddress = $this->getClientIP();
            }
            
            if (!$userAgent) {
                $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
            }
            
            $query = "
                INSERT INTO activity_logs 
                (user_id, action, details, type, target_id, target_type, ip_address, user_agent, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ";
            
            $stmt = $this->conn->prepare($query);
            $result = $stmt->execute([
                $userId,
                $action,
                $details,
                $type,
                $targetId,
                $targetType,
                $ipAddress,
                $userAgent
            ]);
            
            return $result;
            
        } catch (Exception $e) {
            error_log("ActivityLogger Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
        * Log user login
     */
    public function logLogin($userId, $email, $ipAddress = null) {
        return $this->log(
            'user_login',
            'user',
            $userId,
            $userId,
            'user',
            "User logged in: {$email}",
            $ipAddress
        );
    }
    
    /**
     * Log user logout
     */
    public function logLogout($userId, $email, $ipAddress = null) {
        return $this->log(
            'user_logout',
            'user',
            $userId,
            $userId,
            'user',
            "User logged out: {$email}",
            $ipAddress
        );
    }
    
    /**
     * Log booking creation
     */
    public function logBookingCreated($userId, $bookingId, $eventTitle, $ipAddress = null) {
        return $this->log(
            'booking_created',
            'booking',
            $userId,
            $bookingId,
            'booking',
            "New booking created: {$eventTitle}",
            $ipAddress
        );
    }
    
    /**
     * Log booking approval
     */
    public function logBookingApproved($userId, $bookingId, $eventTitle, $ipAddress = null) {
        return $this->log(
            'booking_approved',
            'booking',
            $userId,
            $bookingId,
            'booking',
            "Booking approved: {$eventTitle}",
            $ipAddress
        );
    }
    
    /**
     * Log booking rejection
     */
    public function logBookingRejected($userId, $bookingId, $eventTitle, $ipAddress = null) {
        return $this->log(
            'booking_rejected',
            'booking',
            $userId,
            $bookingId,
            'booking',
            "Booking rejected: {$eventTitle}",
            $ipAddress
        );
    }
    
    /**
     * Log event plan submission
     */
    public function logEventPlanSubmitted($userId, $eventPlanId, $eventTitle, $ipAddress = null) {
        return $this->log(
            'event_plan_submitted',
            'event_plan',
            $userId,
            $eventPlanId,
            'event_plan',
            "Event plan submitted: {$eventTitle}",
            $ipAddress
        );
    }
    
    /**
     * Log event plan approval
     */
    public function logEventPlanApproved($userId, $eventPlanId, $eventTitle, $ipAddress = null) {
        return $this->log(
            'event_plan_approved',
            'event_plan',
            $userId,
            $eventPlanId,
            'event_plan',
            "Event plan approved: {$eventTitle}",
            $ipAddress
        );
    }
    
    /**
     * Log event plan rejection
     */
    public function logEventPlanRejected($userId, $eventPlanId, $eventTitle, $ipAddress = null) {
        return $this->log(
            'event_plan_rejected',
            'event_plan',
            $userId,
            $eventPlanId,
            'event_plan',
            "Event plan rejected: {$eventTitle}",
            $ipAddress
        );
    }
    
    /**
     * Log user creation
     */
    public function logUserCreated($adminUserId, $newUserId, $userEmail, $ipAddress = null) {
        return $this->log(
            'user_created',
            'user',
            $adminUserId,
            $newUserId,
            'user',
            "New user created: {$userEmail}",
            $ipAddress
        );
    }
    
    /**
     * Log user update
     */
    public function logUserUpdated($adminUserId, $targetUserId, $userEmail, $ipAddress = null) {
        return $this->log(
            'user_updated',
            'user',
            $adminUserId,
            $targetUserId,
            'user',
            "User updated: {$userEmail}",
            $ipAddress
        );
    }
    
    /**
     * Log user deletion
     */
    public function logUserDeleted($adminUserId, $userEmail, $ipAddress = null) {
        return $this->log(
            'user_deleted',
            'user',
            $adminUserId,
            null,
            'user',
            "User deleted: {$userEmail}",
            $ipAddress
        );
    }
    
    /**
     * Log system action
     */
    public function logSystemAction($action, $details, $ipAddress = null) {
        return $this->log(
            $action,
            'system',
            null,
            null,
            null,
            $details,
            $ipAddress
        );
    }
    
    /**
     * Get client IP address
     */
    private function getClientIP() {
        $ipKeys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 'HTTP_X_CLUSTER_CLIENT_IP', 'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR'];
        
        foreach ($ipKeys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
}
?>
