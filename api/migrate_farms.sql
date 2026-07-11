-- Migration: Add Farm-Sharing support
-- Run this in phpMyAdmin on the IONOS server

-- 1. Create farms table
CREATE TABLE IF NOT EXISTS farms (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL DEFAULT 'Meine Farm',
    invite_code VARCHAR(8) UNIQUE,
    created_by  INT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Create farm_members table
CREATE TABLE IF NOT EXISTS farm_members (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    farm_id     INT NOT NULL,
    user_id     INT NOT NULL,
    role        ENUM('owner','member') NOT NULL DEFAULT 'member',
    joined_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_farm_user (farm_id, user_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Add farm_id to chickens
ALTER TABLE chickens ADD COLUMN farm_id INT DEFAULT NULL AFTER user_id;
ALTER TABLE chickens ADD INDEX idx_farm (farm_id);

-- 4. Add farm_id to eggs
ALTER TABLE eggs ADD COLUMN farm_id INT DEFAULT NULL AFTER user_id;
ALTER TABLE eggs ADD INDEX idx_farm (farm_id);

-- 5. Migrate existing data: create a farm for each user who has chickens
INSERT INTO farms (name, invite_code, created_by)
SELECT DISTINCT
    CONCAT(u.display_name, 's Farm'),
    SUBSTRING(MD5(RAND()), 1, 8),
    u.id
FROM users u
WHERE u.id IN (SELECT DISTINCT user_id FROM chickens)
   OR u.id IN (SELECT DISTINCT user_id FROM eggs);

-- 6. Add all users as owner of their own farm
INSERT INTO farm_members (farm_id, user_id, role)
SELECT f.id, f.created_by, 'owner'
FROM farms f;

-- 7. Assign existing chickens to the user's farm
UPDATE chickens c
JOIN farms f ON f.created_by = c.user_id
SET c.farm_id = f.id
WHERE c.farm_id IS NULL;

-- 8. Assign existing eggs to the user's farm
UPDATE eggs e
JOIN farms f ON f.created_by = e.user_id
SET e.farm_id = f.id
WHERE e.farm_id IS NULL;
