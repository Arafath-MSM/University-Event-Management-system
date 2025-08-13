<?php
/**
 * Booking Model
 * Eventra ESRS Backend
 */

class Booking {
    private $conn;
    private $table_name = "bookings";

    public $id;
    public $user_id;
    public $venue_id;
    public $event_title;
    public $description;
    public $date;
    public $time;
    public $status;
    public $participants;
    public $facilities;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                SET
                    user_id = :user_id,
                    venue_id = :venue_id,
                    event_title = :event_title,
                    description = :description,
                    date = :date,
                    time = :time,
                    status = :status,
                    participants = :participants,
                    facilities = :facilities";

        $stmt = $this->conn->prepare($query);

        $this->event_title = htmlspecialchars($this->event_title ?? '');
        $this->description = htmlspecialchars($this->description ?? '');
        $this->facilities = htmlspecialchars($this->facilities ?? '');

        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":venue_id", $this->venue_id);
        $stmt->bindParam(":event_title", $this->event_title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":date", $this->date);
        $stmt->bindParam(":time", $this->time);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":participants", $this->participants);
        $stmt->bindParam(":facilities", $this->facilities);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function read($user_id = null, $status = null, $search = null, $date_from = null, $date_to = null) {
        $query = "SELECT b.*, v.name as venue_name, u.name as user_name 
                  FROM " . $this->table_name . " b
                  LEFT JOIN venues v ON b.venue_id = v.id
                  LEFT JOIN users u ON b.user_id = u.id";
        
        $conditions = [];
        $params = [];

        if ($user_id) {
            $conditions[] = "b.user_id = ?";
            $params[] = $user_id;
        }

        if ($status) {
            $conditions[] = "b.status = ?";
            $params[] = $status;
        }

        if ($search) {
            $conditions[] = "(b.event_title LIKE ? OR b.description LIKE ?)";
            $searchParam = "%{$search}%";
            $params[] = $searchParam;
            $params[] = $searchParam;
        }

        if ($date_from) {
            $conditions[] = "b.date >= ?";
            $params[] = $date_from;
        }

        if ($date_to) {
            $conditions[] = "b.date <= ?";
            $params[] = $date_to;
        }

        if (!empty($conditions)) {
            $query .= " WHERE " . implode(" AND ", $conditions);
        }

        $query .= " ORDER BY b.created_at DESC";
        $stmt = $this->conn->prepare($query);

        foreach ($params as $index => $param) {
            $stmt->bindParam($index + 1, $param);
        }

        $stmt->execute();
        return $stmt;
    }

    public function readOne() {
        $query = "SELECT b.*, v.name as venue_name, u.name as user_name 
                  FROM " . $this->table_name . " b
                  LEFT JOIN venues v ON b.venue_id = v.id
                  LEFT JOIN users u ON b.user_id = u.id
                  WHERE b.id = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if($row) {
            $this->id = $row['id'];
            $this->user_id = $row['user_id'];
            $this->venue_id = $row['venue_id'];
            $this->event_title = $row['event_title'];
            $this->description = $row['description'];
            $this->date = $row['date'];
            $this->time = $row['time'];
            $this->status = $row['status'];
            $this->participants = $row['participants'];
            $this->facilities = $row['facilities'];
            $this->created_at = $row['created_at'];
            $this->updated_at = $row['updated_at'];
            return true;
        }
        return false;
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . "
                SET
                    event_title = :event_title,
                    description = :description,
                    date = :date,
                    time = :time,
                    status = :status,
                    participants = :participants,
                    facilities = :facilities
                WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $this->event_title = htmlspecialchars($this->event_title ?? '');
        $this->description = htmlspecialchars($this->description ?? '');
        $this->facilities = htmlspecialchars($this->facilities ?? '');

        $stmt->bindParam(":event_title", $this->event_title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":date", $this->date);
        $stmt->bindParam(":time", $this->time);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":participants", $this->participants);
        $stmt->bindParam(":facilities", $this->facilities);
        $stmt->bindParam(":id", $this->id);

        if($stmt->execute()) {
            return true;
        }
        return false;
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

    public function isVenueAvailable($venue_id, $date, $time) {
        $query = "SELECT COUNT(*) as count FROM " . $this->table_name . " 
                  WHERE venue_id = ? AND date = ? AND time = ? AND status IN ('pending', 'approved')";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $venue_id);
        $stmt->bindParam(2, $date);
        $stmt->bindParam(3, $time);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['count'] == 0;
    }
}
?> 