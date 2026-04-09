CREATE TABLE IF NOT EXISTS farms (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL DEFAULT 'Meine Farm',
    invite_code VARCHAR(8) UNIQUE,
    created_by  INT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

INSERT INTO farms (name, invite_code, created_by)
SELECT DISTINCT
    CONCAT(u.display_name, 's Farm'),
    UPPER(SUBSTRING(MD5(RAND()), 1, 6)),
    u.id
FROM users u
WHERE u.id IN (SELECT DISTINCT user_id FROM chickens)
   OR u.id IN (SELECT DISTINCT user_id FROM eggs);

INSERT INTO farm_members (farm_id, user_id, role)
SELECT f.id, f.created_by, 'owner'
FROM farms f;

UPDATE chickens c
JOIN farms f ON f.created_by = c.user_id
SET c.farm_id = f.id
WHERE c.farm_id IS NULL;

UPDATE eggs e
JOIN farms f ON f.created_by = e.user_id
SET e.farm_id = f.id
WHERE e.farm_id IS NULL
