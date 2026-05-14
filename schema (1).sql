-- ═══════════════════════════════════════════════════════════════════════════════
-- FITNESS MANAGEMENT SYSTEM - COMPREHENSIVE DATABASE SCHEMA
-- Database Concepts: Entity-Relationship Model, Specialization, Integrity Constraints
-- Role-Based Views for Admin, Members, and Trainers
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────
-- CLEANUP
-- ───────────────────────────────────────────────────────────
BEGIN
  FOR i IN (SELECT object_name FROM user_objects WHERE object_type = 'VIEW') LOOP
    EXECUTE IMMEDIATE 'DROP VIEW ' || i.object_name;
  END LOOP;
END;
/

-- ───────────────────────────────────────────────────────────
-- SEQUENCES
-- ───────────────────────────────────────────────────────────
CREATE SEQUENCE users_seq            START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE members_seq          START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE trainers_seq         START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE subscriptions_seq    START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE sessions_seq         START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE workout_plans_seq    START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE nutrition_plans_seq  START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE devices_seq          START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE health_metrics_seq   START WITH 1 INCREMENT BY 1 NOCACHE;

-- ───────────────────────────────────────────────────────────
-- 1. USER SUPER-CLASS (Generic Entity)
-- ───────────────────────────────────────────────────────────
-- Participation Constraint: TOTAL (every user must be either MEMBER, TRAINER, or ADMIN)
-- Specialization: DISJOINT (user cannot be both MEMBER and TRAINER)
CREATE TABLE users (
    user_id           NUMBER         PRIMARY KEY,
    user_type         VARCHAR2(10)   NOT NULL CHECK (user_type IN ('MEMBER', 'TRAINER', 'ADMIN')),
    first_name        VARCHAR2(100)  NOT NULL,
    last_name         VARCHAR2(100)  NOT NULL,
    email             VARCHAR2(200)  UNIQUE NOT NULL,
    phone             VARCHAR2(25),
    dob               DATE,
    registration_date TIMESTAMP      DEFAULT SYSTIMESTAMP,
    
    CONSTRAINT users_email_format CHECK (REGEXP_LIKE(email, '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')),
    CONSTRAINT users_phone_format CHECK (phone IS NULL OR LENGTH(TRIM(phone)) >= 5)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);

-- ───────────────────────────────────────────────────────────
-- 2. USER SUB-CLASSES (Disjoint Specialization)
-- ───────────────────────────────────────────────────────────
-- MEMBERS: Participation Constraint - Optional (user may not be a member)
CREATE TABLE members (
    member_id    NUMBER        PRIMARY KEY,
    user_id      NUMBER        NOT NULL UNIQUE
                               REFERENCES users(user_id) ON DELETE CASCADE,
    fitness_goal VARCHAR2(200),
    date_joined  DATE          DEFAULT SYSDATE,
    
    CONSTRAINT members_valid_user_type CHECK (
        (SELECT user_type FROM users WHERE users.user_id = members.user_id) = 'MEMBER'
    )
);

CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_date_joined ON members(date_joined);

-- TRAINERS: Participation Constraint - Optional (user may not be a trainer)
CREATE TABLE trainers (
    trainer_id     NUMBER         PRIMARY KEY,
    user_id        NUMBER         NOT NULL UNIQUE
                                  REFERENCES users(user_id) ON DELETE CASCADE,
    specialization VARCHAR2(300),
    rating         NUMBER(3,2)    CHECK (rating IS NULL OR rating BETWEEN 0 AND 5),
    years_of_exp   NUMBER(3)      CHECK (years_of_exp IS NULL OR years_of_exp >= 0),
    certification  VARCHAR2(300),
    bio            CLOB,
    
    CONSTRAINT trainers_valid_user_type CHECK (
        (SELECT user_type FROM users WHERE users.user_id = trainers.user_id) = 'TRAINER'
    ),
    CONSTRAINT trainers_positive_years CHECK (years_of_exp IS NULL OR years_of_exp >= 0)
);

CREATE INDEX idx_trainers_user_id ON trainers(user_id);
CREATE INDEX idx_trainers_rating ON trainers(rating);

-- ───────────────────────────────────────────────────────────
-- 3. DEVICE SUPER-CLASS (Generic Entity)
-- ───────────────────────────────────────────────────────────
-- Participation Constraint: TOTAL (every device must be either WEARABLE or MOBILE)
-- Specialization: DISJOINT (device cannot be both WEARABLE and MOBILE)
CREATE TABLE devices (
    device_id    INT           PRIMARY KEY AUTO_INCREMENT,
    member_id    INT           NOT NULL,
    device_name  VARCHAR(200)  NOT NULL,
    manufacturer VARCHAR(200),
    category     ENUM('WEARABLE','MOBILE') NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_devices_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
    CONSTRAINT devices_unique_per_member UNIQUE (member_id, device_name)
);

CREATE INDEX idx_devices_member_id ON devices(member_id);
CREATE INDEX idx_devices_category ON devices(category);

-- ───────────────────────────────────────────────────────────
-- 4. DEVICE SUB-CLASSES (Disjoint Specialization)
-- ───────────────────────────────────────────────────────────
-- WEARABLES: Participation Constraint - Optional (device may not be wearable)
CREATE TABLE wearables (
    device_id    INT PRIMARY KEY,
    battery_life INT,
    sensor_type  VARCHAR(300),
    
    CONSTRAINT fk_wearables_device FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE,
    CONSTRAINT wearables_positive_battery CHECK (battery_life IS NULL OR battery_life > 0)
);

-- MOBILES: Participation Constraint - Optional (device may not be mobile)
CREATE TABLE mobiles (
    device_id    INT PRIMARY KEY,
    os           VARCHAR(100),
    
    CONSTRAINT fk_mobiles_device FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
);


-- ───────────────────────────────────────────────────────────
-- 5. FUNCTIONAL TABLES (Weak Entities & Relationships)
-- ───────────────────────────────────────────────────────────

-- SUBSCRIPTIONS: Weak entity (depends on MEMBER)
-- Participation: Mandatory for billing relationships
CREATE TABLE subscriptions (
    sub_id         NUMBER         PRIMARY KEY,
    member_id      NUMBER         NOT NULL
                                  REFERENCES members(member_id) ON DELETE CASCADE,
    plan_type      VARCHAR2(50)   NOT NULL CHECK (plan_type IN ('BASIC','PREMIUM','ELITE')),
    start_date     DATE           NOT NULL,
    end_date       DATE,
    price          NUMBER(10,2)   NOT NULL CHECK (price >= 0),
    payment_method VARCHAR2(60)   CHECK (payment_method IN ('CREDIT_CARD','DEBIT_CARD','BANK_TRANSFER','PAYPAL')),
    status         VARCHAR2(20)   DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','SUSPENDED','CANCELLED')),
    
    CONSTRAINT subscriptions_date_order CHECK (end_date IS NULL OR end_date > start_date),
    CONSTRAINT subscriptions_unique_active UNIQUE (member_id, plan_type, status) WHERE status = 'ACTIVE'
);

CREATE INDEX idx_subscriptions_member_id ON subscriptions(member_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_dates ON subscriptions(start_date, end_date);

-- SESSIONS: Training sessions conducted by trainers
-- Participation: Mandatory for trainers (trainers must conduct sessions)
CREATE TABLE sessions (
    session_id   NUMBER        PRIMARY KEY,
    trainer_id   NUMBER        NOT NULL
                               REFERENCES trainers(trainer_id) ON DELETE CASCADE,
    session_date DATE          NOT NULL,
    duration     NUMBER(5)     NOT NULL CHECK (duration > 0),
    session_type VARCHAR2(100) NOT NULL CHECK (session_type IN ('STRENGTH','CARDIO','FLEXIBILITY','CORE','FUNCTIONAL','HIIT')),
    location     VARCHAR2(200),
    capacity     NUMBER(3)     DEFAULT 1 CHECK (capacity > 0),
    created_at   TIMESTAMP     DEFAULT SYSTIMESTAMP,
    
    CONSTRAINT sessions_future_date CHECK (session_date >= TRUNC(SYSDATE))
);

CREATE INDEX idx_sessions_trainer_id ON sessions(trainer_id);
CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_sessions_type ON sessions(session_type);

-- WORKOUT PLANS: Training programs designed by trainers
-- Participation: Mandatory for trainers
CREATE TABLE workout_plans (
    plan_id      NUMBER        PRIMARY KEY,
    trainer_id   NUMBER        NOT NULL
                               REFERENCES trainers(trainer_id) ON DELETE CASCADE,
    plan_name    VARCHAR2(200) NOT NULL,
    difficulty   VARCHAR2(50)  NOT NULL CHECK (difficulty IN ('Beginner','Intermediate','Advanced','Elite')),
    duration     NUMBER(4)     NOT NULL CHECK (duration > 0),
    goal_type    VARCHAR2(100) NOT NULL CHECK (goal_type IN ('Weight Loss','Muscle Gain','Endurance','Flexibility','General Fitness')),
    description  CLOB,
    created_at   TIMESTAMP     DEFAULT SYSTIMESTAMP,
    
    CONSTRAINT workout_plans_unique_per_trainer UNIQUE (trainer_id, plan_name)
);

CREATE INDEX idx_workout_plans_trainer_id ON workout_plans(trainer_id);
CREATE INDEX idx_workout_plans_difficulty ON workout_plans(difficulty);
CREATE INDEX idx_workout_plans_goal ON workout_plans(goal_type);

-- NUTRITION PLANS: Dietary programs designed by trainers
-- Participation: Mandatory for trainers
CREATE TABLE nutrition_plans (
    nutrition_plan_id NUMBER        PRIMARY KEY,
    trainer_id        NUMBER        NOT NULL
                                    REFERENCES trainers(trainer_id) ON DELETE CASCADE,
    plan_name         VARCHAR2(200) NOT NULL,
    calorie_target    NUMBER(6)     CHECK (calorie_target IS NULL OR calorie_target > 0),
    diet_type         VARCHAR2(100) NOT NULL CHECK (diet_type IN ('Keto','Vegan','Paleo','Mediterranean','High Protein','Balanced')),
    duration_weeks    NUMBER(3)     NOT NULL CHECK (duration_weeks > 0),
    description       CLOB,
    created_at        TIMESTAMP     DEFAULT SYSTIMESTAMP,
    
    CONSTRAINT nutrition_plans_unique_per_trainer UNIQUE (trainer_id, plan_name)
);

CREATE INDEX idx_nutrition_plans_trainer_id ON nutrition_plans(trainer_id);
CREATE INDEX idx_nutrition_plans_diet_type ON nutrition_plans(diet_type);

-- HEALTH METRICS: Time-series health data from members
-- Participation: Mandatory (every metric must belong to a member)
CREATE TABLE health_metrics (
    metric_id   NUMBER        PRIMARY KEY,
    member_id   NUMBER        NOT NULL
                              REFERENCES members(member_id) ON DELETE CASCADE,
    device_id   NUMBER        REFERENCES devices(device_id) ON DELETE SET NULL,
    metric_type VARCHAR2(100) NOT NULL CHECK (metric_type IN ('Heart Rate','Blood Pressure','Weight','Body Fat %','Steps','Calories Burned','Sleep Hours','VO2 Max','Temperature','Stress Level')),
    value       NUMBER(10,4)  NOT NULL,
    unit        VARCHAR2(50)  NOT NULL,
    measured_at TIMESTAMP     DEFAULT SYSTIMESTAMP,
    notes       VARCHAR2(500),
    
    CONSTRAINT health_metrics_positive_value CHECK (value >= 0),
    CONSTRAINT health_metrics_not_future CHECK (measured_at <= SYSTIMESTAMP)
);

CREATE INDEX idx_health_metrics_member_id ON health_metrics(member_id);
CREATE INDEX idx_health_metrics_device_id ON health_metrics(device_id);
CREATE INDEX idx_health_metrics_type ON health_metrics(metric_type);
CREATE INDEX idx_health_metrics_date ON health_metrics(measured_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGER CONSTRAINTS (Enforcing Disjoint Specialization Rules)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Rule: Prevent a Member from being added as a Trainer (Disjoint User Specialization)
CREATE OR REPLACE TRIGGER trg_user_disjoint_trainer
BEFORE INSERT ON trainers
FOR EACH ROW
DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM members WHERE user_id = :NEW.user_id;
    IF v_count > 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'DISJOINT ERROR: User is already registered as a Member. Cannot register as Trainer.');
    END IF;
END;
/

-- Rule: Prevent a Trainer from being added as a Member (Disjoint User Specialization)
CREATE OR REPLACE TRIGGER trg_user_disjoint_member
BEFORE INSERT ON members
FOR EACH ROW
DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM trainers WHERE user_id = :NEW.user_id;
    IF v_count > 0 THEN
        RAISE_APPLICATION_ERROR(-20002, 'DISJOINT ERROR: User is already registered as a Trainer. Cannot register as Member.');
    END IF;
END;
/

-- Rule: Ensure Device category matches when inserting into wearables
DELIMITER //
CREATE TRIGGER trg_device_wearable_check
BEFORE INSERT ON wearables
FOR EACH ROW
BEGIN
    DECLARE v_cat VARCHAR(10);
    SELECT category INTO v_cat FROM devices WHERE device_id = NEW.device_id;
    IF v_cat != 'WEARABLE' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CATEGORY ERROR: Device is not flagged as WEARABLE.';
    END IF;
END;
//
DELIMITER ;

-- Rule: Ensure Device category matches when inserting into mobiles
DELIMITER //
CREATE TRIGGER trg_device_mobile_check
BEFORE INSERT ON mobiles
FOR EACH ROW
BEGIN
    DECLARE v_cat VARCHAR(10);
    SELECT category INTO v_cat FROM devices WHERE device_id = NEW.device_id;
    IF v_cat != 'MOBILE' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CATEGORY ERROR: Device is not flagged as MOBILE.';
    END IF;
END;
//
DELIMITER ;

-- Rule: Prevent deletion of active subscriptions
CREATE OR REPLACE TRIGGER trg_subscription_status_check
BEFORE DELETE ON subscriptions
FOR EACH ROW
BEGIN
    IF :OLD.status = 'ACTIVE' THEN
        RAISE_APPLICATION_ERROR(-20005, 'INTEGRITY ERROR: Cannot delete active subscription. Set status to CANCELLED first.');
    END IF;
END;
/

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROLE-BASED VIEW DEFINITIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────
-- ADMIN VIEWS: Full data access with sensitive information
-- ───────────────────────────────────────────────────────────

-- Admin: All users with complete information
CREATE OR REPLACE VIEW v_admin_all_users AS
SELECT 
    u.user_id,
    u.user_type,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    u.dob,
    u.registration_date,
    CASE 
        WHEN u.user_type = 'MEMBER' THEN (SELECT member_id FROM members m WHERE m.user_id = u.user_id)
        WHEN u.user_type = 'TRAINER' THEN (SELECT trainer_id FROM trainers t WHERE t.user_id = u.user_id)
        ELSE NULL 
    END AS related_id,
    CASE 
        WHEN u.user_type = 'MEMBER' THEN (SELECT COUNT(*) FROM members WHERE user_id = u.user_id)
        WHEN u.user_type = 'TRAINER' THEN (SELECT COUNT(*) FROM trainers WHERE user_id = u.user_id)
        ELSE 0 
    END AS spec_count
FROM users u
ORDER BY u.registration_date DESC;

-- Admin: All members with summary statistics
CREATE OR REPLACE VIEW v_admin_members AS
SELECT 
    m.member_id,
    m.user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    m.fitness_goal,
    m.date_joined,
    (SELECT COUNT(*) FROM devices WHERE member_id = m.member_id) AS device_count,
    (SELECT COUNT(*) FROM subscriptions WHERE member_id = m.member_id AND status = 'ACTIVE') AS active_subscriptions,
    (SELECT COUNT(*) FROM health_metrics WHERE member_id = m.member_id) AS metric_count
FROM members m
JOIN users u ON m.user_id = u.user_id
ORDER BY m.date_joined DESC;

-- Admin: All trainers with performance metrics
CREATE OR REPLACE VIEW v_admin_trainers AS
SELECT 
    t.trainer_id,
    t.user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    t.specialization,
    t.rating,
    t.years_of_exp,
    t.certification,
    (SELECT COUNT(*) FROM sessions WHERE trainer_id = t.trainer_id) AS session_count,
    (SELECT COUNT(*) FROM workout_plans WHERE trainer_id = t.trainer_id) AS workout_plan_count,
    (SELECT COUNT(*) FROM nutrition_plans WHERE trainer_id = t.trainer_id) AS nutrition_plan_count
FROM trainers t
JOIN users u ON t.user_id = u.user_id
ORDER BY t.rating DESC NULLS LAST;

-- Admin: Financial overview
CREATE OR REPLACE VIEW v_admin_subscriptions AS
SELECT 
    s.sub_id,
    s.member_id,
    CONCAT(u.first_name, ' ', u.last_name) AS member_name,
    u.email AS member_email,
    s.plan_type,
    s.price,
    s.start_date,
    s.end_date,
    s.payment_method,
    s.status,
    ROUND((s.end_date - s.start_date), 0) AS duration_days,
    ROUND(s.price * (LEAST(s.end_date, SYSDATE) - s.start_date) / (s.end_date - s.start_date), 2) AS revenue_realized
FROM subscriptions s
JOIN members m ON s.member_id = m.member_id
JOIN users u ON m.user_id = u.user_id
ORDER BY s.start_date DESC;

-- Admin: All devices inventory
CREATE OR REPLACE VIEW v_admin_devices AS
SELECT 
    d.device_id,
    d.member_id,
    CONCAT(u.first_name, ' ', u.last_name) AS member_name,
    d.device_name,
    d.manufacturer,
    d.category,
    CASE 
        WHEN d.category = 'WEARABLE' THEN (SELECT sensor_type FROM wearables WHERE device_id = d.device_id)
        WHEN d.category = 'MOBILE' THEN (SELECT os FROM mobiles WHERE device_id = d.device_id)
        ELSE 'Unknown'
    END AS device_spec,
    d.registration_date,
    (SELECT COUNT(*) FROM health_metrics WHERE device_id = d.device_id) AS metric_count
FROM devices d
JOIN members m ON d.member_id = m.member_id
JOIN users u ON m.user_id = u.user_id
ORDER BY d.registration_date DESC;

-- ───────────────────────────────────────────────────────────
-- MEMBER VIEWS: Limited data access (self-only + shared content)
-- ───────────────────────────────────────────────────────────

-- Members: View own profile (requires member_id parameter in application)
CREATE OR REPLACE VIEW v_member_profile AS
SELECT 
    m.member_id,
    u.user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    u.dob,
    m.fitness_goal,
    m.date_joined
FROM members m
JOIN users u ON m.user_id = u.user_id;

-- Members: View own devices
CREATE OR REPLACE VIEW v_member_devices AS
SELECT 
    d.device_id,
    d.member_id,
    d.device_name,
    d.manufacturer,
    d.category,
    CASE 
        WHEN d.category = 'WEARABLE' THEN (SELECT sensor_type FROM wearables WHERE device_id = d.device_id)
        WHEN d.category = 'MOBILE' THEN (SELECT os FROM mobiles WHERE device_id = d.device_id)
        ELSE 'Unknown'
    END AS device_spec,
    d.registration_date
FROM devices d
ORDER BY d.registration_date DESC;

-- Members: View own health metrics
CREATE OR REPLACE VIEW v_member_health_metrics AS
SELECT 
    hm.metric_id,
    hm.member_id,
    hm.metric_type,
    hm.value,
    hm.unit,
    hm.measured_at,
    COALESCE(d.device_name, 'Manual Entry') AS source
FROM health_metrics hm
LEFT JOIN devices d ON hm.device_id = d.device_id
ORDER BY hm.measured_at DESC;

-- Members: View own subscriptions
CREATE OR REPLACE VIEW v_member_subscriptions AS
SELECT 
    s.sub_id,
    s.member_id,
    s.plan_type,
    s.price,
    s.start_date,
    s.end_date,
    s.status,
    CASE 
        WHEN s.end_date IS NULL OR s.end_date > SYSDATE THEN 'ACTIVE'
        ELSE 'EXPIRED'
    END AS active_status
FROM subscriptions s
ORDER BY s.start_date DESC;

-- Members: Browse available trainers and their specializations
CREATE OR REPLACE VIEW v_member_available_trainers AS
SELECT 
    t.trainer_id,
    CONCAT(u.first_name, ' ', u.last_name) AS trainer_name,
    t.specialization,
    t.rating,
    t.years_of_exp,
    t.certification,
    (SELECT COUNT(*) FROM sessions WHERE trainer_id = t.trainer_id AND session_date >= SYSDATE) AS upcoming_sessions
FROM trainers t
JOIN users u ON t.user_id = u.user_id
WHERE t.rating IS NOT NULL
ORDER BY t.rating DESC, t.years_of_exp DESC;

-- ───────────────────────────────────────────────────────────
-- TRAINER VIEWS: Limited data access (own content + assigned members)
-- ───────────────────────────────────────────────────────────

-- Trainers: View own profile
CREATE OR REPLACE VIEW v_trainer_profile AS
SELECT 
    t.trainer_id,
    u.user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    t.specialization,
    t.rating,
    t.years_of_exp,
    t.certification,
    t.bio
FROM trainers t
JOIN users u ON t.user_id = u.user_id;

-- Trainers: View own sessions
CREATE OR REPLACE VIEW v_trainer_sessions AS
SELECT 
    s.session_id,
    s.trainer_id,
    s.session_date,
    s.duration,
    s.session_type,
    s.location,
    s.capacity,
    s.created_at
FROM sessions s
ORDER BY s.session_date DESC;

-- Trainers: View own workout plans
CREATE OR REPLACE VIEW v_trainer_workout_plans AS
SELECT 
    wp.plan_id,
    wp.trainer_id,
    wp.plan_name,
    wp.difficulty,
    wp.duration,
    wp.goal_type,
    wp.description,
    wp.created_at
FROM workout_plans wp
ORDER BY wp.created_at DESC;

-- Trainers: View own nutrition plans
CREATE OR REPLACE VIEW v_trainer_nutrition_plans AS
SELECT 
    np.nutrition_plan_id,
    np.trainer_id,
    np.plan_name,
    np.calorie_target,
    np.diet_type,
    np.duration_weeks,
    np.description,
    np.created_at
FROM nutrition_plans np
ORDER BY np.created_at DESC;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ANALYTICAL VIEWS FOR REPORTING
-- ═══════════════════════════════════════════════════════════════════════════════

-- System Health: Member-Trainer relationship overview
CREATE OR REPLACE VIEW v_system_member_trainer_pairing AS
SELECT 
    m.member_id,
    CONCAT(mu.first_name, ' ', mu.last_name) AS member_name,
    m.fitness_goal,
    t.trainer_id,
    CONCAT(tu.first_name, ' ', tu.last_name) AS trainer_name,
    t.specialization,
    t.rating,
    (SELECT COUNT(*) FROM sessions WHERE trainer_id = t.trainer_id) AS session_count
FROM members m
JOIN users mu ON m.user_id = mu.user_id
CROSS JOIN trainers t
JOIN users tu ON t.user_id = tu.user_id;

-- System Health: Active memberships and revenue
CREATE OR REPLACE VIEW v_system_revenue AS
SELECT 
    TRUNC(s.start_date, 'MONTH') AS month,
    s.plan_type,
    COUNT(*) AS subscription_count,
    SUM(s.price) AS total_revenue,
    AVG(s.price) AS avg_price,
    MIN(s.price) AS min_price,
    MAX(s.price) AS max_price
FROM subscriptions s
WHERE s.status = 'ACTIVE'
GROUP BY TRUNC(s.start_date, 'MONTH'), s.plan_type
ORDER BY month DESC, total_revenue DESC;

-- System Health: Health metrics summary by member
CREATE OR REPLACE VIEW v_system_health_summary AS
SELECT 
    hm.member_id,
    CONCAT(u.first_name, ' ', u.last_name) AS member_name,
    COUNT(DISTINCT hm.metric_type) AS metric_types_tracked,
    MAX(hm.measured_at) AS last_measurement,
    COUNT(*) AS total_measurements,
    (SYSDATE - m.date_joined) AS days_as_member
FROM health_metrics hm
JOIN members m ON hm.member_id = m.member_id
JOIN users u ON m.user_id = u.user_id
GROUP BY hm.member_id, CONCAT(u.first_name, ' ', u.last_name), m.date_joined
ORDER BY total_measurements DESC;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SAMPLE DATA INSERTION
-- ═══════════════════════════════════════════════════════════════════════════════

-- Insert Users
INSERT INTO users (user_id, user_type, first_name, last_name, email, phone, dob) 
VALUES (users_seq.NEXTVAL, 'MEMBER', 'Ali', 'Raza', 'ali.raza@email.com', '03001234567', TO_DATE('1995-05-15','YYYY-MM-DD'));

INSERT INTO users (user_id, user_type, first_name, last_name, email, phone, dob) 
VALUES (users_seq.NEXTVAL, 'MEMBER', 'Sara', 'Khan', 'sara.khan@email.com', '03009876543', TO_DATE('1998-08-22','YYYY-MM-DD'));

INSERT INTO users (user_id, user_type, first_name, last_name, email, phone, dob) 
VALUES (users_seq.NEXTVAL, 'TRAINER', 'Usman', 'Ahmed', 'usman.ahmed@email.com', '03115550123', TO_DATE('1990-03-10','YYYY-MM-DD'));

INSERT INTO users (user_id, user_type, first_name, last_name, email, phone, dob) 
VALUES (users_seq.NEXTVAL, 'TRAINER', 'Aisha', 'Malik', 'aisha.malik@email.com', '03115550124', TO_DATE('1992-07-05','YYYY-MM-DD'));

INSERT INTO users (user_id, user_type, first_name, last_name, email) 
VALUES (users_seq.NEXTVAL, 'ADMIN', 'Admin', 'User', 'admin@fitcore.com');

-- Insert Members
INSERT INTO members (member_id, user_id, fitness_goal, date_joined) 
VALUES (members_seq.NEXTVAL, 1, 'Weight Loss', TO_DATE('2024-01-10','YYYY-MM-DD'));

INSERT INTO members (member_id, user_id, fitness_goal, date_joined) 
VALUES (members_seq.NEXTVAL, 2, 'Muscle Gain', TO_DATE('2024-02-14','YYYY-MM-DD'));

-- Insert Trainers
INSERT INTO trainers (trainer_id, user_id, specialization, rating, years_of_exp, certification) 
VALUES (trainers_seq.NEXTVAL, 3, 'Strength Training', 4.8, 8, 'NASM Certified');

INSERT INTO trainers (trainer_id, user_id, specialization, rating, years_of_exp, certification) 
VALUES (trainers_seq.NEXTVAL, 4, 'Cardio & Endurance', 4.6, 6, 'ACE Certified');

-- Insert Subscriptions
INSERT INTO subscriptions (sub_id, member_id, plan_type, start_date, end_date, price, payment_method, status)
VALUES (subscriptions_seq.NEXTVAL, 1, 'PREMIUM', TO_DATE('2024-01-10','YYYY-MM-DD'), TO_DATE('2024-04-10','YYYY-MM-DD'), 99.99, 'CREDIT_CARD', 'ACTIVE');

INSERT INTO subscriptions (sub_id, member_id, plan_type, start_date, end_date, price, payment_method, status)
VALUES (subscriptions_seq.NEXTVAL, 2, 'ELITE', TO_DATE('2024-02-14','YYYY-MM-DD'), TO_DATE('2024-05-14','YYYY-MM-DD'), 199.99, 'BANK_TRANSFER', 'ACTIVE');

-- Insert Devices
INSERT INTO devices (device_id, member_id, device_name, manufacturer, category)
VALUES (devices_seq.NEXTVAL, 1, 'Apple Watch Series 8', 'Apple', 'WEARABLE');

INSERT INTO devices (device_id, member_id, device_name, manufacturer, category)
VALUES (devices_seq.NEXTVAL, 2, 'Samsung Galaxy S24', 'Samsung', 'MOBILE');

-- Insert Device Specializations
INSERT INTO wearables (device_id, battery_life, sensor_type)
VALUES (1, 18, 'Heart Rate, ECG, Blood Oxygen');

INSERT INTO mobiles (device_id, os)
VALUES (2, 'Android 14');

-- Insert Sessions
INSERT INTO sessions (session_id, trainer_id, session_date, duration, session_type, location, capacity)
VALUES (sessions_seq.NEXTVAL, 1, SYSDATE + 3, 60, 'STRENGTH', 'Gym Floor A', 15);

INSERT INTO sessions (session_id, trainer_id, session_date, duration, session_type, location, capacity)
VALUES (sessions_seq.NEXTVAL, 2, SYSDATE + 5, 45, 'CARDIO', 'Cardio Zone', 10);

-- Insert Workout Plans
INSERT INTO workout_plans (plan_id, trainer_id, plan_name, difficulty, duration, goal_type, description)
VALUES (workout_plans_seq.NEXTVAL, 1, 'Full Body Strength', 'Intermediate', 12, 'Muscle Gain', 'Comprehensive strength training program');

INSERT INTO workout_plans (plan_id, trainer_id, plan_name, difficulty, duration, goal_type, description)
VALUES (workout_plans_seq.NEXTVAL, 2, 'Marathon Training', 'Advanced', 16, 'Endurance', 'Intensive endurance and cardio program');

-- Insert Nutrition Plans
INSERT INTO nutrition_plans (nutrition_plan_id, trainer_id, plan_name, calorie_target, diet_type, duration_weeks)
VALUES (nutrition_plans_seq.NEXTVAL, 1, 'High Protein Bulk', 2800, 'High Protein', 12);

INSERT INTO nutrition_plans (nutrition_plan_id, trainer_id, plan_name, calorie_target, diet_type, duration_weeks)
VALUES (nutrition_plans_seq.NEXTVAL, 2, 'Balanced Weight Loss', 1800, 'Balanced', 8);

-- Insert Health Metrics
INSERT INTO health_metrics (metric_id, member_id, device_id, metric_type, value, unit, measured_at, notes)
VALUES (health_metrics_seq.NEXTVAL, 1, 1, 'Heart Rate', 72, 'bpm', SYSTIMESTAMP - INTERVAL '1' DAY, 'Morning measurement');

INSERT INTO health_metrics (metric_id, member_id, device_id, metric_type, value, unit, measured_at)
VALUES (health_metrics_seq.NEXTVAL, 1, 1, 'Weight', 75.5, 'kg', SYSTIMESTAMP - INTERVAL '2' DAY);

INSERT INTO health_metrics (metric_id, member_id, device_id, metric_type, value, unit, measured_at)
VALUES (health_metrics_seq.NEXTVAL, 2, 2, 'Steps', 8500, 'steps', SYSTIMESTAMP - INTERVAL '1' DAY);

INSERT INTO health_metrics (metric_id, member_id, metric_type, value, unit, measured_at)
VALUES (health_metrics_seq.NEXTVAL, 2, 'Sleep Hours', 7.5, 'hours', SYSTIMESTAMP - INTERVAL '1' DAY);

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════════
-- DATA VERIFICATION QUERIES (Run to test)
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '=== ADMIN VIEW TEST ===' AS test_info FROM DUAL;
SELECT * FROM v_admin_all_users;
SELECT * FROM v_admin_members;
SELECT * FROM v_admin_trainers;

SELECT '=== MEMBER VIEW TEST ===' AS test_info FROM DUAL;
SELECT * FROM v_member_profile WHERE member_id = 1;
SELECT * FROM v_member_health_metrics WHERE member_id = 1;
SELECT * FROM v_member_available_trainers;

SELECT '=== SYSTEM ANALYTICS ===' AS test_info FROM DUAL;
SELECT * FROM v_system_health_summary;
SELECT * FROM v_system_revenue;

COMMIT;
