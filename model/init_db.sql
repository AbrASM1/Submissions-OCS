-- init.sql
CREATE TABLE IF NOT EXISTS submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_name VARCHAR(255) NOT NULL,
  note TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS submission_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  filename VARCHAR(255),
  path VARCHAR(512),
  originalname VARCHAR(255),
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS submission_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  url TEXT NOT NULL,
  label VARCHAR(255),
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);
