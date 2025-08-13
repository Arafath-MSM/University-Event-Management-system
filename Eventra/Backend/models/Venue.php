<?php
/**
 * Venue Model
 * Eventra ESRS Backend
 */

class Venue {
    private $conn;
    private $table_name = "venues";

    public $id;
    public $name;
    public $capacity;
    public $location;
    public $type;
    public $availability;
    public $restrictions;
    public $images;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                SET
                    name = :name,
                    capacity = :capacity,
                    location = :location,
                    type = :type,
                    status = :status,
                    restrictions = :restrictions,
                    images = :images";

        $stmt = $this->conn->prepare($query);

        $this->name = htmlspecialchars($this->name ?? '');
        $this->location = htmlspecialchars($this->location ?? '');
        $this->type = htmlspecialchars($this->type ?? '');
        $this->status = htmlspecialchars($this->status ?? '');
        $this->restrictions = htmlspecialchars($this->restrictions ?? '');
        $this->images = htmlspecialchars($this->images ?? '');

        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":capacity", $this->capacity);
        $stmt->bindParam(":location", $this->location);
        $stmt->bindParam(":type", $this->type);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":restrictions", $this->restrictions);
        $stmt->bindParam(":images", $this->images);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function read($search = null, $type = null, $min_capacity = null) {
        $query = "SELECT * FROM " . $this->table_name;
        $conditions = [];
        $params = [];

        if ($search) {
            $conditions[] = "(name LIKE ? OR location LIKE ?)";
            $searchParam = "%{$search}%";
            $params[] = $searchParam;
            $params[] = $searchParam;
        }

        if ($type) {
            $conditions[] = "type = ?";
            $params[] = $type;
        }

        if ($min_capacity) {
            $conditions[] = "capacity >= ?";
            $params[] = $min_capacity;
        }

        if (!empty($conditions)) {
            $query .= " WHERE " . implode(" AND ", $conditions);
        }

        $query .= " ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);

        foreach ($params as $index => $param) {
            $stmt->bindParam($index + 1, $param);
        }

        $stmt->execute();
        return $stmt;
    }

    public function readOne() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if($row) {
            $this->id = $row['id'];
            $this->name = $row['name'];
            $this->capacity = $row['capacity'];
            $this->location = $row['location'];
            $this->type = $row['type'];
            $this->availability = $row['availability'];
            $this->restrictions = $row['restrictions'];
            $this->images = $row['images'];
            $this->created_at = $row['created_at'];
            $this->updated_at = $row['updated_at'];
            return true;
        }
        return false;
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . "
                SET
                    name = :name,
                    capacity = :capacity,
                    location = :location,
                    type = :type,
                    availability = :availability,
                    restrictions = :restrictions,
                    images = :images
                WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $this->name = htmlspecialchars($this->name ?? '');
        $this->location = htmlspecialchars($this->location ?? '');
        $this->type = htmlspecialchars($this->type ?? '');
        $this->availability = htmlspecialchars($this->availability ?? '');
        $this->restrictions = htmlspecialchars($this->restrictions ?? '');
        $this->images = htmlspecialchars($this->images ?? '');

        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":capacity", $this->capacity);
        $stmt->bindParam(":location", $this->location);
        $stmt->bindParam(":type", $this->type);
        $stmt->bindParam(":availability", $this->availability);
        $stmt->bindParam(":restrictions", $this->restrictions);
        $stmt->bindParam(":images", $this->images);
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

    public function isAvailable($date, $time) {
        $query = "SELECT COUNT(*) as count FROM bookings 
                  WHERE venue_id = ? AND date = ? AND time = ? AND status != 'rejected'";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        $stmt->bindParam(2, $date);
        $stmt->bindParam(3, $time);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['count'] == 0;
    }
}
?> 