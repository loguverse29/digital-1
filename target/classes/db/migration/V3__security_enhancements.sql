-- ===================================================================
-- Flyway Database Migration V3: Security Module Enhancements
-- 1. Add brute-force attempt tracking & account lockout columns
-- 2. Add sample INVESTIGATOR account
-- ===================================================================

ALTER TABLE users 
    ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0,
    ADD COLUMN account_non_locked BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN lock_time TIMESTAMP NULL;

-- Insert investigator demo account with BCrypt password "Password@123"
INSERT INTO users (username, full_name, email, password_hash, role, badge_number, active_status, failed_login_attempts, account_non_locked) 
VALUES ('investigator2', 'Det. Alex Rivera', 'arivera@forensics.gov', '$2a$10$Dow1YdG5yD0q7b7fN9G4sO3tLw7e3B.Jk4N4b4e9E9a9e3A0s7uTC', 'INVESTIGATOR', 'INV-FIELD-501', TRUE, 0, TRUE)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);
