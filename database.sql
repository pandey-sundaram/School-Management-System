-- ============================================================
-- KENDRIYA VIDYALAYA - BASIC DATABASE SCHEMA
-- ============================================================

DROP DATABASE IF EXISTS school_management_system;
CREATE DATABASE school_management_system;
USE school_management_system;

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL -- 'admin', 'teacher', 'student'
);

-- Table: students
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  class_name VARCHAR(50) NOT NULL,
  roll_number VARCHAR(20) NOT NULL,
  address VARCHAR(255) DEFAULT '',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table: attendance
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'Present', 'Absent'
  UNIQUE KEY uq_attendance (student_id, date),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Table: marks
CREATE TABLE IF NOT EXISTS marks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject_name VARCHAR(100) NOT NULL,
  marks_obtained INT NOT NULL,
  exam_type VARCHAR(50) NOT NULL, -- 'Mid Term', 'Final'
  UNIQUE KEY uq_marks (student_id, subject_name, exam_type),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ============================================================
-- DEMO SEED USERS
-- ============================================================

-- Admin: admin / Admin@123
INSERT IGNORE INTO users (id, username, password, email, role)
VALUES (1, 'admin', '$2b$10$IDtt/FJXIdBitqaMUt6Nn.6MsYy1aUu2ouqyIgTf3b7WzLzF0v68G', 'admin@kv.edu', 'admin');

-- Teacher: teacher1 / Teacher@123
INSERT IGNORE INTO users (id, username, password, email, role)
VALUES (2, 'teacher1', '$2b$10$B5b/S0Pt4U/am2dJ/qPRWuvfCa7MSC42zTx8B1ih6v3vb8zD5bINC', 'teacher1@kv.edu', 'teacher');

-- Student: student1 / Student@123
INSERT IGNORE INTO users (id, username, password, email, role)
VALUES (3, 'student1', '$2b$10$F/a0BbGxNf1q6nc/O0zpsugUId661Qehnl3fPJAj8LoiTTXeWJ8.y', 'student1@kv.edu', 'student');

-- Student Record
INSERT IGNORE INTO students (id, user_id, full_name, class_name, roll_number, address)
VALUES (1, 3, 'Aarav Sharma', 'Class 10', '001', '123 Gali, Delhi');
