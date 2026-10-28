-- ===================================================================
-- Flyway Database Migration V1: Initial Schema
-- Digital Evidence Management & Cyber Crime Investigation System
-- Target Database: MySQL 8.x
-- ===================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    badge_number VARCHAR(50),
    active_status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Investigation Cases Table
CREATE TABLE IF NOT EXISTS investigation_cases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_number VARCHAR(50) NOT NULL UNIQUE,
    case_name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'HIGH',
    assigned_investigator_id BIGINT,
    assigned_investigator_name VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    incident_date TIMESTAMP NULL,
    court_jurisdiction VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_case_investigator FOREIGN KEY (assigned_investigator_id) 
        REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_case_status (status),
    INDEX idx_case_category (category),
    INDEX idx_case_number (case_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Evidence Table
CREATE TABLE IF NOT EXISTS evidence (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    evidence_number VARCHAR(50) NOT NULL UNIQUE,
    case_id BIGINT NOT NULL,
    evidence_name VARCHAR(200) NOT NULL,
    evidence_type VARCHAR(50) NOT NULL,
    description TEXT,
    source_device VARCHAR(150),
    collector_id BIGINT,
    collector_name VARCHAR(100) NOT NULL,
    collection_timestamp TIMESTAMP NOT NULL,
    original_sha256_hash CHAR(64) NOT NULL,
    controlled_storage_identifier VARCHAR(100) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    file_mime_type VARCHAR(100),
    file_storage_path VARCHAR(500),
    verified_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    last_verification_timestamp TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_evidence_case FOREIGN KEY (case_id) 
        REFERENCES investigation_cases (id) ON DELETE CASCADE,
    CONSTRAINT fk_evidence_collector FOREIGN KEY (collector_id) 
        REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_evidence_case_id (case_id),
    INDEX idx_evidence_number (evidence_number),
    INDEX idx_evidence_sha256 (original_sha256_hash),
    INDEX idx_evidence_status (verified_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Evidence Hashes Table (Verification History)
CREATE TABLE IF NOT EXISTS evidence_hashes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    evidence_id BIGINT NOT NULL,
    algorithm VARCHAR(20) NOT NULL DEFAULT 'SHA-256',
    original_hash CHAR(64) NOT NULL,
    calculated_hash CHAR(64) NOT NULL,
    verification_outcome VARCHAR(30) NOT NULL,
    verification_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verifying_user_id BIGINT,
    verifying_user_name VARCHAR(100) NOT NULL,
    notes TEXT,
    CONSTRAINT fk_hash_evidence FOREIGN KEY (evidence_id) 
        REFERENCES evidence (id) ON DELETE CASCADE,
    CONSTRAINT fk_hash_user FOREIGN KEY (verifying_user_id) 
        REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_hash_evidence_id (evidence_id),
    INDEX idx_hash_outcome (verification_outcome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Chain Of Custody Table (Immutable audit trail of evidence possession)
CREATE TABLE IF NOT EXISTS chain_of_custody (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    evidence_id BIGINT NOT NULL,
    case_id BIGINT NOT NULL,
    actor_id BIGINT,
    actor_name VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    previous_custodian VARCHAR(100) NOT NULL,
    new_custodian VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    location VARCHAR(150),
    remarks TEXT,
    custody_signature_token VARCHAR(100),
    CONSTRAINT fk_custody_evidence FOREIGN KEY (evidence_id) 
        REFERENCES evidence (id) ON DELETE CASCADE,
    CONSTRAINT fk_custody_case FOREIGN KEY (case_id) 
        REFERENCES investigation_cases (id) ON DELETE CASCADE,
    CONSTRAINT fk_custody_actor FOREIGN KEY (actor_id) 
        REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_custody_evidence (evidence_id),
    INDEX idx_custody_case (case_id),
    INDEX idx_custody_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Investigation Activities Table
CREATE TABLE IF NOT EXISTS investigation_activities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id BIGINT NOT NULL,
    evidence_id BIGINT NULL,
    actor_id BIGINT,
    actor_name VARCHAR(100) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    activity_description TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_case FOREIGN KEY (case_id) 
        REFERENCES investigation_cases (id) ON DELETE CASCADE,
    CONSTRAINT fk_activity_evidence FOREIGN KEY (evidence_id) 
        REFERENCES evidence (id) ON DELETE SET NULL,
    CONSTRAINT fk_activity_actor FOREIGN KEY (actor_id) 
        REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_activity_case (case_id),
    INDEX idx_activity_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Audit Logs Table (System-wide security logging)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    username VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_timestamp (timestamp),
    INDEX idx_audit_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
