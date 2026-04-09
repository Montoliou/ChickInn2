ALTER TABLE moult_periods ADD COLUMN farm_id INT DEFAULT NULL AFTER user_id;
ALTER TABLE moult_periods ADD INDEX idx_farm (farm_id);

ALTER TABLE medications ADD COLUMN farm_id INT DEFAULT NULL AFTER user_id;
ALTER TABLE medications ADD INDEX idx_farm (farm_id);

ALTER TABLE medications MODIFY COLUMN end_date BIGINT DEFAULT NULL;

UPDATE moult_periods mp
JOIN chickens c ON c.id = mp.chicken_id
SET mp.farm_id = c.farm_id
WHERE mp.farm_id IS NULL;

UPDATE medications m
JOIN chickens c ON c.id = m.chicken_id
SET m.farm_id = c.farm_id
WHERE m.farm_id IS NULL;
