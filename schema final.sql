
CREATE DATABASE IF NOT EXISTS fit;
USE fit;


USE fit;
SHOW TABLES;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS health_metrics, mobiles, wearables, devices, nutrition_plans, workout_plans, sessions, subscriptions, trainers, members, users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
    user_id           INT AUTO_INCREMENT PRIMARY KEY,
    user_type         ENUM('MEMBER','TRAINER','ADMIN') NOT NULL,
    first_name        VARCHAR(100) NOT NULL,
    last_name         VARCHAR(100) NOT NULL,
    email             VARCHAR(200) NOT NULL UNIQUE,
    phone             VARCHAR(25),
    dob               DATE,
    password_hash     VARCHAR(255) NOT NULL DEFAULT '$2b$10$placeholder',
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_phone CHECK (phone IS NULL OR CHAR_LENGTH(TRIM(phone)) >= 5)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type  ON users(user_type);

CREATE TABLE members (
    member_id    INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL UNIQUE,
    fitness_goal VARCHAR(200),
    date_joined  DATE DEFAULT (CURRENT_DATE),
    CONSTRAINT fk_members_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_members_user_id    ON members(user_id);
CREATE INDEX idx_members_date_joined ON members(date_joined);

-- 
CREATE TABLE trainers (
    trainer_id     INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL UNIQUE,
    specialization VARCHAR(300),
    rating         DECIMAL(3,2) CHECK (rating IS NULL OR rating BETWEEN 0 AND 5),
    years_of_exp   INT CHECK (years_of_exp IS NULL OR years_of_exp >= 0),
    certification  VARCHAR(300),
    bio            TEXT,
    CONSTRAINT fk_trainers_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_trainers_user_id ON trainers(user_id);
CREATE INDEX idx_trainers_rating  ON trainers(rating);

CREATE TABLE devices (
    device_id         INT AUTO_INCREMENT PRIMARY KEY,
    member_id         INT NOT NULL,
    device_name       VARCHAR(200) NOT NULL,
    manufacturer      VARCHAR(200),
    category          ENUM('WEARABLE','MOBILE') NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_devices_member    FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
    CONSTRAINT uq_devices_per_member UNIQUE (member_id, device_name)
);

CREATE INDEX idx_devices_member_id ON devices(member_id);
CREATE INDEX idx_devices_category  ON devices(category);

CREATE TABLE wearables (
    device_id    INT PRIMARY KEY,
    battery_life INT CHECK (battery_life IS NULL OR battery_life > 0),
    sensor_type  VARCHAR(300),
    CONSTRAINT fk_wearables_device FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
);

CREATE TABLE mobiles (
    device_id INT PRIMARY KEY,
    os        VARCHAR(100),
    CONSTRAINT fk_mobiles_device FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
);

CREATE TABLE subscriptions (
    sub_id         INT AUTO_INCREMENT PRIMARY KEY,
    member_id      INT NOT NULL,
    plan_type      ENUM('BASIC','PREMIUM','ELITE') NOT NULL,
    start_date     DATE NOT NULL,
    end_date       DATE,
    price          DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    payment_method ENUM('CREDIT_CARD','DEBIT_CARD','BANK_TRANSFER','PAYPAL'),
    status         ENUM('ACTIVE','INACTIVE','SUSPENDED','CANCELLED') DEFAULT 'ACTIVE',
    CONSTRAINT fk_subscriptions_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
    CONSTRAINT chk_sub_dates CHECK (end_date IS NULL OR end_date > start_date)
);

CREATE INDEX idx_subscriptions_member_id ON subscriptions(member_id);
CREATE INDEX idx_subscriptions_status    ON subscriptions(status);
CREATE INDEX idx_subscriptions_dates     ON subscriptions(start_date, end_date);

CREATE TABLE sessions (
    session_id   INT AUTO_INCREMENT PRIMARY KEY,
    trainer_id   INT NOT NULL,
    session_date DATE NOT NULL,
    duration     INT NOT NULL CHECK (duration > 0),
    session_type ENUM('STRENGTH','CARDIO','FLEXIBILITY','CORE','FUNCTIONAL','HIIT') NOT NULL,
    location     VARCHAR(200),
    capacity     INT DEFAULT 1 CHECK (capacity > 0),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sessions_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(trainer_id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_trainer_id ON sessions(trainer_id);
CREATE INDEX idx_sessions_date       ON sessions(session_date);
CREATE INDEX idx_sessions_type       ON sessions(session_type);

CREATE TABLE workout_plans (
    plan_id      INT AUTO_INCREMENT PRIMARY KEY,
    trainer_id   INT NOT NULL,
    plan_name    VARCHAR(200) NOT NULL,
    difficulty   ENUM('Beginner','Intermediate','Advanced','Elite') NOT NULL,
    duration     INT NOT NULL CHECK (duration > 0),
    goal_type    ENUM('Weight Loss','Muscle Gain','Endurance','Flexibility','General Fitness') NOT NULL,
    description  TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_workout_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(trainer_id) ON DELETE CASCADE,
    CONSTRAINT uq_workout_per_trainer UNIQUE (trainer_id, plan_name)
);

CREATE INDEX idx_workout_plans_trainer_id ON workout_plans(trainer_id);
CREATE INDEX idx_workout_plans_difficulty ON workout_plans(difficulty);

CREATE TABLE nutrition_plans (
    nutrition_plan_id INT AUTO_INCREMENT PRIMARY KEY,
    trainer_id        INT NOT NULL,
    plan_name         VARCHAR(200) NOT NULL,
    calorie_target    INT CHECK (calorie_target IS NULL OR calorie_target > 0),
    diet_type         ENUM('Keto','Vegan','Paleo','Mediterranean','High Protein','Balanced') NOT NULL,
    duration_weeks    INT NOT NULL CHECK (duration_weeks > 0),
    description       TEXT,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_nutrition_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(trainer_id) ON DELETE CASCADE,
    CONSTRAINT uq_nutrition_per_trainer UNIQUE (trainer_id, plan_name)
);

CREATE INDEX idx_nutrition_plans_trainer_id ON nutrition_plans(trainer_id);

CREATE TABLE health_metrics (
    metric_id   INT AUTO_INCREMENT PRIMARY KEY,
    member_id   INT NOT NULL,
    device_id   INT,
    metric_type ENUM('Heart Rate','Blood Pressure','Weight','Body Fat %','Steps','Calories Burned','Sleep Hours','VO2 Max','Temperature','Stress Level') NOT NULL,
    value       DECIMAL(10,4) NOT NULL CHECK (value >= 0),
    unit        VARCHAR(50) NOT NULL,
    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes       VARCHAR(500),
    CONSTRAINT fk_metrics_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
    CONSTRAINT fk_metrics_device FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE SET NULL
);

CREATE INDEX idx_health_metrics_member_id ON health_metrics(member_id);
CREATE INDEX idx_health_metrics_device_id ON health_metrics(device_id);
CREATE INDEX idx_health_metrics_type      ON health_metrics(metric_type);
CREATE INDEX idx_health_metrics_date      ON health_metrics(measured_at);


DELIMITER //

-- Prevent a TRAINER from becoming a MEMBER (Disjoint User)
CREATE TRIGGER trg_user_disjoint_member
BEFORE INSERT ON members
FOR EACH ROW
BEGIN
    DECLARE v_count INT;
    DECLARE v_type  VARCHAR(10);
    SELECT COUNT(*) INTO v_count FROM trainers WHERE user_id = NEW.user_id;
    IF v_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DISJOINT ERROR: User is already a Trainer.';
    END IF;
    SELECT user_type INTO v_type FROM users WHERE user_id = NEW.user_id;
    IF v_type != 'MEMBER' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'TOTAL PARTICIPATION ERROR: user_type must be MEMBER.';
    END IF;
END;
//

CREATE TRIGGER trg_user_disjoint_trainer
BEFORE INSERT ON trainers
FOR EACH ROW
BEGIN
    DECLARE v_count INT;
    DECLARE v_type  VARCHAR(10);
    SELECT COUNT(*) INTO v_count FROM members WHERE user_id = NEW.user_id;
    IF v_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DISJOINT ERROR: User is already a Member.';
    END IF;
    SELECT user_type INTO v_type FROM users WHERE user_id = NEW.user_id;
    IF v_type != 'TRAINER' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'TOTAL PARTICIPATION ERROR: user_type must be TRAINER.';
    END IF;
END;
//

CREATE TRIGGER trg_device_wearable_check
BEFORE INSERT ON wearables
FOR EACH ROW
BEGIN
    DECLARE v_cat VARCHAR(10);
    DECLARE v_cnt INT;
    SELECT category INTO v_cat FROM devices WHERE device_id = NEW.device_id;
    IF v_cat != 'WEARABLE' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CATEGORY ERROR: Device is not WEARABLE.';
    END IF;
    SELECT COUNT(*) INTO v_cnt FROM mobiles WHERE device_id = NEW.device_id;
    IF v_cnt > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DISJOINT ERROR: Device is already registered as MOBILE.';
    END IF;
END;
//

CREATE TRIGGER trg_device_mobile_check
BEFORE INSERT ON mobiles
FOR EACH ROW
BEGIN
    DECLARE v_cat VARCHAR(10);
    DECLARE v_cnt INT;
    SELECT category INTO v_cat FROM devices WHERE device_id = NEW.device_id;
    IF v_cat != 'MOBILE' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CATEGORY ERROR: Device is not MOBILE.';
    END IF;
    SELECT COUNT(*) INTO v_cnt FROM wearables WHERE device_id = NEW.device_id;
    IF v_cnt > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DISJOINT ERROR: Device is already registered as WEARABLE.';
    END IF;
END;
//

CREATE TRIGGER trg_subscription_no_delete_active
BEFORE DELETE ON subscriptions
FOR EACH ROW
BEGIN
    IF OLD.status = 'ACTIVE' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INTEGRITY ERROR: Cannot delete an ACTIVE subscription. Cancel it first.';
    END IF;
END;
//

DELIMITER ;

CREATE OR REPLACE VIEW v_admin_all_users AS
SELECT u.user_id, u.user_type, u.first_name, u.last_name, u.email, u.phone, u.dob, u.registration_date
FROM users u
ORDER BY u.registration_date DESC;

CREATE OR REPLACE VIEW v_admin_members AS
SELECT m.member_id, m.user_id, u.first_name, u.last_name, u.email, u.phone, m.fitness_goal, m.date_joined,
    (SELECT COUNT(*) FROM devices WHERE member_id = m.member_id) AS device_count,
    (SELECT COUNT(*) FROM subscriptions WHERE member_id = m.member_id AND status = 'ACTIVE') AS active_subscriptions,
    (SELECT COUNT(*) FROM health_metrics WHERE member_id = m.member_id) AS metric_count
FROM members m JOIN users u ON m.user_id = u.user_id
ORDER BY m.date_joined DESC;

CREATE OR REPLACE VIEW v_admin_trainers AS
SELECT t.trainer_id, t.user_id, u.first_name, u.last_name, u.email, u.phone,
    t.specialization, t.rating, t.years_of_exp, t.certification,
    (SELECT COUNT(*) FROM sessions WHERE trainer_id = t.trainer_id) AS session_count,
    (SELECT COUNT(*) FROM workout_plans WHERE trainer_id = t.trainer_id) AS workout_plan_count,
    (SELECT COUNT(*) FROM nutrition_plans WHERE trainer_id = t.trainer_id) AS nutrition_plan_count
FROM trainers t JOIN users u ON t.user_id = u.user_id
ORDER BY t.rating DESC;

CREATE OR REPLACE VIEW v_admin_subscriptions AS
SELECT s.sub_id, s.member_id, CONCAT(u.first_name,' ',u.last_name) AS member_name, u.email AS member_email,
    s.plan_type, s.price, s.start_date, s.end_date, s.payment_method, s.status,
    DATEDIFF(s.end_date, s.start_date) AS duration_days
FROM subscriptions s
JOIN members m ON s.member_id = m.member_id
JOIN users u ON m.user_id = u.user_id
ORDER BY s.start_date DESC;

CREATE OR REPLACE VIEW v_admin_devices AS
SELECT d.device_id, d.member_id, CONCAT(u.first_name,' ',u.last_name) AS member_name,
    d.device_name, d.manufacturer, d.category,
    CASE WHEN d.category = 'WEARABLE' THEN (SELECT sensor_type FROM wearables WHERE device_id = d.device_id)
         WHEN d.category = 'MOBILE'   THEN (SELECT os FROM mobiles WHERE device_id = d.device_id)
         ELSE 'Unknown' END AS device_spec,
    d.registration_date,
    (SELECT COUNT(*) FROM health_metrics WHERE device_id = d.device_id) AS metric_count
FROM devices d
JOIN members m ON d.member_id = m.member_id
JOIN users u ON m.user_id = u.user_id
ORDER BY d.registration_date DESC;

CREATE OR REPLACE VIEW v_admin_revenue AS
SELECT DATE_FORMAT(s.start_date, '%Y-%m') AS month, s.plan_type,
    COUNT(*) AS subscription_count, SUM(s.price) AS total_revenue,
    AVG(s.price) AS avg_price
FROM subscriptions s WHERE s.status = 'ACTIVE'
GROUP BY DATE_FORMAT(s.start_date, '%Y-%m'), s.plan_type
ORDER BY month DESC;

-- MEMBER VIEWS
CREATE OR REPLACE VIEW v_member_profile AS
SELECT m.member_id, u.user_id, u.first_name, u.last_name, u.email, u.phone, u.dob, m.fitness_goal, m.date_joined
FROM members m JOIN users u ON m.user_id = u.user_id;

CREATE OR REPLACE VIEW v_member_devices AS
SELECT d.device_id, d.member_id, d.device_name, d.manufacturer, d.category,
    CASE WHEN d.category = 'WEARABLE' THEN (SELECT sensor_type FROM wearables WHERE device_id = d.device_id)
         WHEN d.category = 'MOBILE'   THEN (SELECT os FROM mobiles WHERE device_id = d.device_id)
         ELSE 'Unknown' END AS device_spec,
    d.registration_date
FROM devices d ORDER BY d.registration_date DESC;

CREATE OR REPLACE VIEW v_member_health_metrics AS
SELECT hm.metric_id, hm.member_id, hm.metric_type, hm.value, hm.unit, hm.measured_at,
    COALESCE(d.device_name, 'Manual Entry') AS source
FROM health_metrics hm LEFT JOIN devices d ON hm.device_id = d.device_id
ORDER BY hm.measured_at DESC;

CREATE OR REPLACE VIEW v_member_subscriptions AS
SELECT s.sub_id, s.member_id, s.plan_type, s.price, s.start_date, s.end_date, s.status,
    CASE WHEN s.end_date IS NULL OR s.end_date > CURDATE() THEN 'ACTIVE' ELSE 'EXPIRED' END AS current_status
FROM subscriptions s ORDER BY s.start_date DESC;

CREATE OR REPLACE VIEW v_member_available_trainers AS
SELECT t.trainer_id, CONCAT(u.first_name,' ',u.last_name) AS trainer_name,
    t.specialization, t.rating, t.years_of_exp, t.certification,
    (SELECT COUNT(*) FROM sessions WHERE trainer_id = t.trainer_id AND session_date >= CURDATE()) AS upcoming_sessions
FROM trainers t JOIN users u ON t.user_id = u.user_id
WHERE t.rating IS NOT NULL ORDER BY t.rating DESC;

-- TRAINER VIEWS
CREATE OR REPLACE VIEW v_trainer_profile AS
SELECT t.trainer_id, u.user_id, u.first_name, u.last_name, u.email, u.phone,
    t.specialization, t.rating, t.years_of_exp, t.certification, t.bio
FROM trainers t JOIN users u ON t.user_id = u.user_id;

CREATE OR REPLACE VIEW v_trainer_sessions AS
SELECT s.session_id, s.trainer_id, s.session_date, s.duration, s.session_type, s.location, s.capacity, s.created_at
FROM sessions s ORDER BY s.session_date DESC;

CREATE OR REPLACE VIEW v_trainer_workout_plans AS
SELECT wp.plan_id, wp.trainer_id, wp.plan_name, wp.difficulty, wp.duration, wp.goal_type, wp.description, wp.created_at
FROM workout_plans wp ORDER BY wp.created_at DESC;

CREATE OR REPLACE VIEW v_trainer_nutrition_plans AS
SELECT np.nutrition_plan_id, np.trainer_id, np.plan_name, np.calorie_target, np.diet_type, np.duration_weeks, np.description, np.created_at
FROM nutrition_plans np ORDER BY np.created_at DESC;

CREATE OR REPLACE VIEW v_trainer_members_health AS
SELECT hm.metric_id, hm.member_id, CONCAT(u.first_name,' ',u.last_name) AS member_name,
    hm.metric_type, hm.value, hm.unit, hm.measured_at
FROM health_metrics hm
JOIN members m ON hm.member_id = m.member_id
JOIN users u ON m.user_id = u.user_id
ORDER BY hm.measured_at DESC;

INSERT INTO users (user_type, first_name, last_name, email, phone, dob, password_hash) VALUES
('MEMBER',  'Ali',   'Raza',   'ali.raza@email.com',    '03001234567', '1995-05-15', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('MEMBER',  'Sara',  'Khan',   'sara.khan@email.com',   '03009876543', '1998-08-22', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('TRAINER', 'Usman', 'Ahmed',  'usman.ahmed@email.com', '03115550123', '1990-03-10', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('TRAINER', 'Aisha', 'Malik',  'aisha.malik@email.com', '03115550124', '1992-07-05', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('ADMIN',   'Admin', 'User',   'admin@fitcore.com',     NULL,          NULL,         '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

INSERT INTO members (user_id, fitness_goal, date_joined) VALUES
(1, 'Weight Loss', '2024-01-10'),
(2, 'Muscle Gain', '2024-02-14');

INSERT INTO trainers (user_id, specialization, rating, years_of_exp, certification) VALUES
(3, 'Strength Training', 4.8, 8, 'NASM Certified'),
(4, 'Cardio & Endurance', 4.6, 6, 'ACE Certified');

INSERT INTO subscriptions (member_id, plan_type, start_date, end_date, price, payment_method, status) VALUES
(1, 'PREMIUM', '2024-01-10', '2025-01-10', 99.99,  'CREDIT_CARD',   'ACTIVE'),
(2, 'ELITE',   '2024-02-14', '2025-02-14', 199.99, 'BANK_TRANSFER', 'ACTIVE');

INSERT INTO devices (member_id, device_name, manufacturer, category) VALUES
(1, 'Apple Watch Series 8', 'Apple',   'WEARABLE'),
(2, 'Samsung Galaxy S24',   'Samsung', 'MOBILE');

INSERT INTO wearables (device_id, battery_life, sensor_type) VALUES (1, 18, 'Heart Rate, ECG, Blood Oxygen');
INSERT INTO mobiles   (device_id, os)                         VALUES (2, 'Android 14');

INSERT INTO sessions (trainer_id, session_date, duration, session_type, location, capacity) VALUES
(1, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 60, 'STRENGTH', 'Gym Floor A', 15),
(2, DATE_ADD(CURDATE(), INTERVAL 5 DAY), 45, 'CARDIO',   'Cardio Zone', 10);

INSERT INTO workout_plans (trainer_id, plan_name, difficulty, duration, goal_type, description) VALUES
(1, 'Full Body Strength', 'Intermediate', 12, 'Muscle Gain',  'Comprehensive strength training program'),
(2, 'Marathon Training',  'Advanced',     16, 'Endurance',    'Intensive endurance and cardio program');

INSERT INTO nutrition_plans (trainer_id, plan_name, calorie_target, diet_type, duration_weeks) VALUES
(1, 'High Protein Bulk',    2800, 'High Protein', 12),
(2, 'Balanced Weight Loss', 1800, 'Balanced',      8);

INSERT INTO health_metrics (member_id, device_id, metric_type, value, unit, measured_at, notes) VALUES
(1, 1, 'Heart Rate', 72,   'bpm',   DATE_SUB(NOW(), INTERVAL 1 DAY), 'Morning measurement'),
(1, 1, 'Weight',     75.5, 'kg',    DATE_SUB(NOW(), INTERVAL 2 DAY), NULL),
(2, 2, 'Steps',      8500, 'steps', DATE_SUB(NOW(), INTERVAL 1 DAY), NULL),
(2, NULL, 'Sleep Hours', 7.5, 'hours', DATE_SUB(NOW(), INTERVAL 1 DAY), NULL);



