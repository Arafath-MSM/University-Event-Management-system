<?php
/**
 * Notification Model
 * Eventra ESRS Backend
 */

class Notification {
    private $conn;
    private $table_name = "notifications";

    public $id;
    public $user_id;
    public $title;
    public $message;
    public $type;
    public $status;
    public $related_booking_id;
    public $related_venue_id;
    public $metadata;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                SET
                    user_id = :user_id,
                    title = :title,
                    message = :message,
                    type = :type,
                    related_booking_id = :related_booking_id,
                    related_venue_id = :related_venue_id,
                    metadata = :metadata";

        $stmt = $this->conn->prepare($query);

        $this->title = htmlspecialchars($this->title ?? '');
        $this->message = htmlspecialchars($this->message ?? '');
        $this->metadata = $this->metadata ? json_encode($this->metadata) : null;

        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":message", $this->message);
        $stmt->bindParam(":type", $this->type);
        $stmt->bindParam(":related_booking_id", $this->related_booking_id);
        $stmt->bindParam(":related_venue_id", $this->related_venue_id);
        $stmt->bindParam(":metadata", $this->metadata);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function read($user_id = null, $status = null, $type = null, $limit = null) {
        $query = "SELECT n.*, b.event_title as booking_title, v.name as venue_name 
                  FROM " . $this->table_name . " n
                  LEFT JOIN bookings b ON n.related_booking_id = b.id
                  LEFT JOIN venues v ON n.related_venue_id = v.id";
        
        $conditions = [];
        $params = [];

        if ($user_id) {
            $conditions[] = "n.user_id = :user_id";
            $params[':user_id'] = $user_id;
        }

        if ($status) {
            $conditions[] = "n.status = :status";
            $params[':status'] = $status;
        }

        if ($type) {
            $conditions[] = "n.type = :type";
            $params[':type'] = $type;
        }

        if (!empty($conditions)) {
            $query .= " WHERE " . implode(" AND ", $conditions);
        }

        $query .= " ORDER BY n.created_at DESC";
        
        if ($limit) {
            $query .= " LIMIT " . (int)$limit;
        }

        error_log("Notification read query: " . $query);
        error_log("Notification read params: " . json_encode($params));

        $stmt = $this->conn->prepare($query);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        $stmt->execute();
        return $stmt;
    }

    public function readOne() {
        $query = "SELECT n.*, b.event_title as booking_title, v.name as venue_name 
                  FROM " . $this->table_name . " n
                  LEFT JOIN bookings b ON n.related_booking_id = b.id
                  LEFT JOIN venues v ON n.related_venue_id = v.id
                  WHERE n.id = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if($row) {
            $this->id = $row['id'];
            $this->user_id = $row['user_id'];
            $this->title = $row['title'];
            $this->message = $row['message'];
            $this->type = $row['type'];
            $this->status = $row['status'];
            $this->related_booking_id = $row['related_booking_id'];
            $this->related_venue_id = $row['related_venue_id'];
            $this->metadata = $row['metadata'];
            $this->created_at = $row['created_at'];
            $this->updated_at = $row['updated_at'];
            return true;
        }
        return false;
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . "
                SET
                    status = :status
                WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":id", $this->id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function markAsRead() {
        $this->status = 'read';
        return $this->update();
    }

    public function markAllAsRead($user_id) {
        $query = "UPDATE " . $this->table_name . "
                SET status = 'read'
                WHERE user_id = ? AND status = 'unread'";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $user_id);
        
        return $stmt->execute();
    }

    public function getUnreadCount($user_id) {
        $query = "SELECT COUNT(*) as count FROM " . $this->table_name . " 
                  WHERE user_id = ? AND status = 'unread'";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $user_id);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['count'];
    }

    public function createBookingRequestNotification($user_id, $booking_id, $venue_id, $event_title) {
        $this->user_id = $user_id;
        $this->title = "Booking Request Submitted";
        $this->message = "Your booking request for '{$event_title}' has been submitted and is pending approval.";
        $this->type = 'booking_request';
        $this->related_booking_id = $booking_id;
        $this->related_venue_id = $venue_id;
        $this->metadata = [
            'event_title' => $event_title,
            'action_required' => 'wait_for_approval'
        ];
        
        return $this->create();
    }

    public function createBookingApprovedNotification($user_id, $booking_id, $event_title) {
        $this->user_id = $user_id;
        $this->title = "Booking Approved";
        $this->message = "Your booking request for '{$event_title}' has been approved! You can now proceed with your event.";
        $this->type = 'booking_approved';
        $this->related_booking_id = $booking_id;
        $this->metadata = [
            'event_title' => $event_title,
            'action_required' => 'none'
        ];
        
        return $this->create();
    }

    public function createBookingRejectedNotification($user_id, $booking_id, $event_title, $reason = '') {
        $this->user_id = $user_id;
        $this->title = "Booking Rejected";
        $this->message = "Your booking request for '{$event_title}' has been rejected." . ($reason ? " Reason: {$reason}" : "");
        $this->type = 'booking_rejected';
        $this->related_booking_id = $booking_id;
        $this->metadata = [
            'event_title' => $event_title,
            'reason' => $reason,
            'action_required' => 'review_and_resubmit'
        ];
        
        return $this->create();
    }

    public function createLetterSentNotification($user_id, $booking_id, $event_title, $letter_type) {
        $this->user_id = $user_id;
        $this->title = "Letter Sent";
        $this->message = "A {$letter_type} letter has been sent for your booking '{$event_title}'.";
        $this->type = 'letter_sent';
        $this->related_booking_id = $booking_id;
        $this->metadata = [
            'event_title' => $event_title,
            'letter_type' => $letter_type
        ];
        
        return $this->create();
    }

    public function createFinalApprovalNotification($user_id, $booking_id, $event_title) {
        $this->user_id = $user_id;
        $this->title = "Final Approval";
        $this->message = "Your booking '{$event_title}' has received final approval! All required signatures have been collected.";
        $this->type = 'final_approval';
        $this->related_booking_id = $booking_id;
        $this->metadata = [
            'event_title' => $event_title,
            'action_required' => 'proceed_with_event'
        ];
        
        return $this->create();
    }
    
    public function createAdminNotification($user_id, $title, $message, $type) {
        $this->user_id = $user_id;
        $this->title = $title;
        $this->message = $message;
        $this->type = $type;
        $this->related_booking_id = null;
        $this->related_venue_id = null;
        $this->metadata = [
            'action_required' => $type === 'booking_action_confirmation' ? 'none' : 'admin_review'
        ];
        
        return $this->create();
    }

    public function createBookingStatusNotification($user_id, $booking_id, $venue_id, $event_title, $status) {
        $this->user_id = $user_id;
        $this->title = "Booking Status Updated";
        $this->message = "Your booking for '{$event_title}' has been {$status}.";
        $this->type = "booking_status_update";
        $this->related_booking_id = $booking_id;
        $this->related_venue_id = $venue_id;
        $this->metadata = json_encode([
            'event_title' => $event_title,
            'status' => $status,
            'action_required' => 'none'
        ]);
        
        return $this->create();
    }

    public function createEventPlanNotification($user_id, $title, $message, $type, $event_plan_id = null) {
        $this->user_id = $user_id;
        $this->title = $title;
        $this->message = $message;
        $this->type = $type;
        $this->related_booking_id = null; 
        $this->related_venue_id = null; 
        $this->metadata = json_encode([
            'event_plan_id' => $event_plan_id,
            'action_required' => 'none'
        ]);
        
        return $this->create();
    }
}
?> 