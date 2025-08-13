<?php
/**
 * User Model
 * Eventra ESRS Backend
 */


class User {
    private $conn;
    private $table_name = "users";

    public $id;
    public $name;
    public $email;
    public $password_hash;
    public $role;
    public $department;
    public $faculty;
    public $designation;
    public $bio;
    public $event_interests;
    public $service_type;
    public $status;
    public $is_email_verified;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                SET
                    name = :name,
                    email = :email,
                    password_hash = :password_hash,
                    role = :role,
                    department = :department,
                    faculty = :faculty,
                    designation = :designation,
                    bio = :bio,
                    event_interests = :event_interests,
                    service_type = :service_type,
                    status = :status,
                    is_email_verified = :is_email_verified";

        $stmt = $this->conn->prepare($query);

        
        $this->name = htmlspecialchars($this->name ?? '');
        $this->email = htmlspecialchars($this->email ?? '');
        $this->role = htmlspecialchars($this->role ?? '');
        $this->department = htmlspecialchars($this->department ?? '');
        $this->faculty = htmlspecialchars($this->faculty ?? '');
        $this->designation = htmlspecialchars($this->designation ?? '');
        $this->bio = htmlspecialchars($this->bio ?? '');
        $this->event_interests = htmlspecialchars($this->event_interests ?? '');
        $this->service_type = htmlspecialchars($this->service_type ?? '');

        
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":password_hash", $this->password_hash);
        $stmt->bindParam(":role", $this->role);
        $stmt->bindParam(":department", $this->department);
        $stmt->bindParam(":faculty", $this->faculty);
        $stmt->bindParam(":designation", $this->designation);
        $stmt->bindParam(":bio", $this->bio);
        $stmt->bindParam(":event_interests", $this->event_interests);
        $stmt->bindParam(":service_type", $this->service_type);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":is_email_verified", $this->is_email_verified);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    
    public function read($role = null, $search = null) {
        $query = "SELECT * FROM " . $this->table_name;
        $conditions = [];
        $params = [];
        
        if ($role) {
            $conditions[] = "role = :role";
            $params[':role'] = $role;
        }
        
        if ($search) {
            $conditions[] = "(name LIKE :search OR email LIKE :search OR department LIKE :search)";
            $params[':search'] = "%{$search}%";
        }
        
        if (!empty($conditions)) {
            $query .= " WHERE " . implode(" AND ", $conditions);
        }
        
        $query .= " ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();
        
        $users = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $users[] = [
                'id' => $row['id'],
                'name' => $row['name'],
                'email' => $row['email'],
                'role' => $row['role'],
                'department' => $row['department'],
                'faculty' => $row['faculty'],
                'designation' => $row['designation'],
                'bio' => $row['bio'],
                'event_interests' => $row['event_interests'],
                'service_type' => $row['service_type'],
                'status' => $row['status'],
                'is_email_verified' => $row['is_email_verified'],
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at']
            ];
        }
        
        return $users;
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
            $this->email = $row['email'];
            $this->role = $row['role'];
            $this->department = $row['department'];
            $this->faculty = $row['faculty'];
            $this->designation = $row['designation'];
            $this->bio = $row['bio'];
            $this->event_interests = $row['event_interests'];
            $this->service_type = $row['service_type'];
            $this->status = $row['status'];
            $this->is_email_verified = $row['is_email_verified'];
            $this->created_at = $row['created_at'];
            $this->updated_at = $row['updated_at'];
            return true;
        }
        return false;
    }

    
    public function readByEmail() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE email = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->email);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if($row) {
            $this->id = $row['id'];
            $this->name = $row['name'];
            $this->email = $row['email'];
            $this->password_hash = $row['password_hash'];
            $this->role = $row['role'];
            $this->department = $row['department'];
            $this->faculty = $row['faculty'];
            $this->designation = $row['designation'];
            $this->bio = $row['bio'];
            $this->event_interests = $row['event_interests'];
            $this->service_type = $row['service_type'];
            $this->status = $row['status'];
            $this->is_email_verified = $row['is_email_verified'];
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
                    email = :email,
                    role = :role,
                    department = :department,
                    faculty = :faculty,
                    designation = :designation,
                    bio = :bio,
                    event_interests = :event_interests,
                    service_type = :service_type,
                    status = :status,
                    is_email_verified = :is_email_verified
                WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        
        $this->name = htmlspecialchars($this->name ?? '');
        $this->email = htmlspecialchars($this->email ?? '');
        $this->role = htmlspecialchars($this->role ?? '');
        $this->department = htmlspecialchars($this->department ?? '');
        $this->faculty = htmlspecialchars($this->faculty ?? '');
        $this->designation = htmlspecialchars($this->designation ?? '');
        $this->bio = htmlspecialchars($this->bio ?? '');
        $this->event_interests = htmlspecialchars($this->event_interests ?? '');
        $this->service_type = htmlspecialchars($this->service_type ?? '');

        
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":role", $this->role);
        $stmt->bindParam(":department", $this->department);
        $stmt->bindParam(":faculty", $this->faculty);
        $stmt->bindParam(":designation", $this->designation);
        $stmt->bindParam(":bio", $this->bio);
        $stmt->bindParam(":event_interests", $this->event_interests);
        $stmt->bindParam(":service_type", $this->service_type);
        $stmt->bindParam(":status", $this->status);
        $stmt->bindParam(":is_email_verified", $this->is_email_verified);
        $stmt->bindParam(":id", $this->id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    
    public function updatePassword() {
        $query = "UPDATE " . $this->table_name . " SET password_hash = :password_hash WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":password_hash", $this->password_hash);
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

    public function search($keywords) {
        $query = "SELECT * FROM " . $this->table_name . "
                WHERE
                    name LIKE ? OR
                    email LIKE ? OR
                    department LIKE ? OR
                    faculty LIKE ?
                ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($query);
        $keywords = "%{$keywords}%";
        $stmt->bindParam(1, $keywords);
        $stmt->bindParam(2, $keywords);
        $stmt->bindParam(3, $keywords);
        $stmt->bindParam(4, $keywords);
        $stmt->execute();
        return $stmt;
    }

    public function getByRole($role) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE role = ? ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $role);
        $stmt->execute();
        return $stmt;
    }

    public function emailExists() {
        $query = "SELECT id FROM " . $this->table_name . " WHERE email = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->email);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            return true;
        }
        return false;
    }

    public function getCountByRole($role) {
        $query = "SELECT COUNT(*) as count FROM " . $this->table_name . " WHERE role = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $role);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['count'];
    }
}
?> 