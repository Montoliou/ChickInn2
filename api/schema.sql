-- ChickInn Web App – MySQL Schema
-- Run this once in phpMyAdmin on your IONOS server

CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS auth_tokens (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    token       VARCHAR(64) NOT NULL UNIQUE,
    expires_at  DATETIME NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chickens (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    name        VARCHAR(100) NOT NULL,
    breed       VARCHAR(100) DEFAULT NULL,
    notes       TEXT DEFAULT NULL,
    photo_url   VARCHAR(500) DEFAULT NULL,
    created_at  BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS eggs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    chicken_id  INT NOT NULL,
    user_id     INT NOT NULL,
    laid_at     BIGINT NOT NULL,
    notes       TEXT DEFAULT NULL,
    FOREIGN KEY (chicken_id) REFERENCES chickens(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_chicken (chicken_id),
    INDEX idx_laid (laid_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS moult_periods (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    chicken_id  INT NOT NULL,
    user_id     INT NOT NULL,
    farm_id     INT DEFAULT NULL,
    start_date  BIGINT NOT NULL,
    end_date    BIGINT DEFAULT NULL,
    notes       TEXT DEFAULT NULL,
    FOREIGN KEY (chicken_id) REFERENCES chickens(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_farm (farm_id),
    INDEX idx_chicken (chicken_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS medications (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    chicken_id  INT NOT NULL,
    user_id     INT NOT NULL,
    farm_id     INT DEFAULT NULL,
    name        VARCHAR(200) NOT NULL,
    start_date  BIGINT NOT NULL,
    end_date    BIGINT DEFAULT NULL,
    notes       TEXT DEFAULT NULL,
    FOREIGN KEY (chicken_id) REFERENCES chickens(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_farm (farm_id),
    INDEX idx_chicken (chicken_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
