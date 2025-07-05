-- Create database
CREATE DATABASE IF NOT EXISTS hackathon_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE hackathon_db;

-- ----------------------------
-- Table: submissions
-- ----------------------------
CREATE TABLE IF NOT EXISTS submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_name VARCHAR(255) NOT NULL,
  note TEXT DEFAULT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------
-- Table: submission_files
-- ----------------------------
CREATE TABLE IF NOT EXISTS submission_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  filename VARCHAR(255),
  path VARCHAR(512),
  originalname VARCHAR(255),
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);

-- ----------------------------
-- Table: submission_links
-- ----------------------------
CREATE TABLE IF NOT EXISTS submission_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  url TEXT NOT NULL,
  label VARCHAR(255),
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);
