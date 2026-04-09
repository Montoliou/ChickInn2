CREATE TABLE IF NOT EXISTS health_logs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    chicken_id  INT NOT NULL,
    user_id     INT NOT NULL,
    farm_id     INT DEFAULT NULL,
    log_date    DATE NOT NULL,
    checks_json TEXT NOT NULL,
    notes       TEXT DEFAULT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chicken_id) REFERENCES chickens(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_chicken_date (chicken_id, log_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
