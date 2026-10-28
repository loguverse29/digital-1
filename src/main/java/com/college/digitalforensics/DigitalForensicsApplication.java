package com.college.digitalforensics;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Digital Evidence Management and Cyber Crime Investigation System
 * Final Year Academic & Enterprise Demonstration Project
 *
 * Core Capabilities:
 * - Immutable Chain of Custody tracking
 * - Real-time SHA-256 cryptographic evidence hashing & tampering detection
 * - Role-Based Access Control (Admin, Lead Investigator, Forensic Analyst, Custodian)
 * - Court-admissible forensic case dossier generation via OpenPDF
 * - System-level security audit logging
 */
@SpringBootApplication
@EnableJpaAuditing
@EnableAsync
public class DigitalForensicsApplication {

    public static void main(String[] args) {
        SpringApplication.run(DigitalForensicsApplication.class, args);
    }
}
