<?php
/**
 * SignedLetter Model
 * Eventra ESRS Backend
 */

class SignedLetter {
    private $conn;
    private $table_name = "signed_letters";

    public $id;
    public $booking_id;
    public $event_plan_id;
    public $from_role;
    public $to_role;
    public $letter_type;
    public $letter_content;
    public $signature_data;
    public $status;
    public $sent_at;
    public $received_at;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        if ($this->booking_id) {
            $query = "INSERT INTO " . $this->table_name . "
                    SET
                        booking_id = :booking_id,
                        from_role = :from_role,
                        to_role = :to_role,
                        letter_type = :letter_type,
                        letter_content = :letter_content,
                        signature_data = :signature_data,
                        status = :status";
        } else {
            $query = "INSERT INTO " . $this->table_name . "
                    SET
                        event_plan_id = :event_plan_id,
                        from_role = :from_role,
                        to_role = :to_role,
                        letter_type = :letter_type,
                        letter_content = :letter_content,
                        signature_data = :signature_data,
                        status = :status";
        }

        $stmt = $this->conn->prepare($query);

        // Do not escape base64/data URL content; escaping will corrupt the PDF data
        $this->letter_content = $this->letter_content ?? '';
        $this->signature_data = $this->signature_data ? json_encode($this->signature_data) : null;

        if ($this->booking_id) {
            $stmt->bindParam(":booking_id", $this->booking_id);
        } else {
            $stmt->bindParam(":event_plan_id", $this->event_plan_id);
        }
        $stmt->bindParam(":from_role", $this->from_role);
        $stmt->bindParam(":to_role", $this->to_role);
        $stmt->bindParam(":letter_type", $this->letter_type);
        $stmt->bindParam(":letter_content", $this->letter_content);
        $stmt->bindParam(":signature_data", $this->signature_data);
        $stmt->bindParam(":status", $this->status);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function read($booking_id = null, $event_plan_id = null, $from_role = null, $status = null, $letter_type = null) {
        $query = "SELECT sl.*, 
                         COALESCE(b.event_title, ep.title) as event_title,
                         COALESCE(b.user_id, ep.user_id) as booking_user_id, 
                         u.name as user_name 
                  FROM " . $this->table_name . " sl
                  LEFT JOIN bookings b ON sl.booking_id = b.id
                  LEFT JOIN event_plans ep ON sl.event_plan_id = ep.id
                  LEFT JOIN users u ON COALESCE(b.user_id, ep.user_id) = u.id";
        
        $conditions = [];
        $params = [];

        if ($booking_id) {
            $conditions[] = "sl.booking_id = :booking_id";
            $params[':booking_id'] = $booking_id;
        }

        if ($event_plan_id) {
            $conditions[] = "sl.event_plan_id = :event_plan_id";
            $params[':event_plan_id'] = $event_plan_id;
        }

        if ($from_role) {
            $conditions[] = "sl.from_role = :from_role";
            $params[':from_role'] = $from_role;
        }

        if ($status) {
            $conditions[] = "sl.status = :status";
            $params[':status'] = $status;
        }

        if ($letter_type) {
            $conditions[] = "sl.letter_type = :letter_type";
            $params[':letter_type'] = $letter_type;
        }

        if (!empty($conditions)) {
            $query .= " WHERE " . implode(" AND ", $conditions);
        }

        $query .= " ORDER BY sl.created_at DESC";

        $stmt = $this->conn->prepare($query);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        $stmt->execute();
        return $stmt;
    }

    public function readOne() {
        $query = "SELECT sl.*, 
                         COALESCE(b.event_title, ep.title) as event_title,
                         COALESCE(b.user_id, ep.user_id) as booking_user_id, 
                         u.name as user_name 
                  FROM " . $this->table_name . " sl
                  LEFT JOIN bookings b ON sl.booking_id = b.id
                  LEFT JOIN event_plans ep ON sl.event_plan_id = ep.id
                  LEFT JOIN users u ON COALESCE(b.user_id, ep.user_id) = u.id
                  WHERE sl.id = ? LIMIT 0,1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if($row) {
            $this->id = $row['id'];
            $this->booking_id = $row['booking_id'];
            $this->event_plan_id = $row['event_plan_id'];
            $this->from_role = $row['from_role'];
            $this->to_role = $row['to_role'];
            $this->letter_type = $row['letter_type'];
            $this->letter_content = $row['letter_content'];
            $this->signature_data = $row['signature_data'];
            $this->status = $row['status'];
            $this->sent_at = $row['sent_at'];
            $this->received_at = $row['received_at'];
            $this->created_at = $row['created_at'];
            $this->updated_at = $row['updated_at'];
            return true;
        }
        return false;
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . "
                SET
                    from_role = :from_role,
                    to_role = :to_role,
                    letter_type = :letter_type,
                    letter_content = :letter_content,
                    signature_data = :signature_data,
                    status = :status,
                    sent_at = :sent_at,
                    received_at = :received_at
                WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $this->letter_content = $this->letter_content ?? '';
        $this->signature_data = $this->signature_data ? json_encode($this->signature_data) : null;

        $stmt->bindParam(":from_role", $this->from_role);
        $stmt->bindParam(":to_role", $this->to_role);
        $stmt->bindParam(":letter_type", $this->letter_type);
        $stmt->bindParam(":letter_content", $this->letter_content);
        $stmt->bindParam(":signature_data", $this->signature_data);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":sent_at", $this->sent_at);
        $stmt->bindParam(":received_at", $this->received_at);
        $stmt->bindParam(":id", $this->id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function markAsSent() {
        $this->status = 'sent';
        $this->sent_at = date('Y-m-d H:i:s');
        return $this->update();
    }

    public function markAsReceived() {
        $this->status = 'received';
        $this->received_at = date('Y-m-d H:i:s');
        return $this->update();
    }

    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        
        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?> 