# Digital Evidence Management and Cyber Crime Investigation System

An enterprise-grade, academic final-year capstone project and law enforcement digital forensics suite adhering to **ISO/IEC 27037:2012** (Guidelines for identification, collection, acquisition, and preservation of digital evidence).

---

## 1. Project Overview & System Capabilities

The **Digital Evidence Management and Cyber Crime Investigation System** provides complete lifecycle management for electronic evidence seized across computer crime scenes. It guarantees evidentiary chain-of-custody integrity, detects bitstream tampering via cryptographic **SHA-256** checksum parity, enforces Role-Based Access Control (**RBAC**), and automatically generates court-admissible forensic dossiers.

### Core Modules:
- **Authentication & RBAC**: Strict separation of concerns across 4 law enforcement roles: `ADMIN`, `LEAD_INVESTIGATOR`, `FORENSIC_ANALYST`, and `EVIDENCE_CUSTODIAN`.
- **Investigation Docket Management**: Case docketing with automated numbering (`CASE-YYYY-XXXX`), priority classification, incident narratives, and status tracking (`OPEN`, `IN_PROGRESS`, `CLOSED`).
- **Secure Evidence Vault**: Physical & digital evidence registration with hardware write-blocker tracking, controlled locker identification (`SECURE-VAULT-BAY-XX`), and immediate 256-bit SHA-256 fingerprinting.
- **Cryptographic SHA-256 Verification & Tamper Simulation**: Live verification of evidence bitstreams with instant mismatch flagging (`VERIFIED_INTACT` vs. `TAMPERED_MISMATCH`), demonstrating the SHA-256 avalanche effect.
- **Immutable Chain of Custody (CoC) Ledger**: Sequential tracking of all handovers, checkouts for laboratory analysis, court appearances, and secure storage deposits with digital signature tokens (`SIG-CUSTODY-XXXX`).
- **Activity Stream & Audit Logs**: High-resolution, append-only security auditing recording every user action, IP address, and security exception.
- **Court-Admissible PDF Dossier Generator**: Generates formal judicial dossiers containing case briefs, evidence inventories, cryptographic hashes, and custody history using **OpenPDF**.

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Language** | Java | 21 LTS | Core backend business logic & type safety |
| **Framework** | Spring Boot | 3.3.4 | Dependency injection, MVC, and web server |
| **Security** | Spring Security | 6.x | RBAC, session management, BCrypt passwords |
| **ORM / Persistence** | Spring Data JPA / Hibernate | 6.x | Relational object-relational mapping |
| **Database** | MySQL | 8.x | Relational persistence with foreign keys & indexes |
| **Database Migration**| Flyway | 10.x | Version-controlled DDL (`V1__init_schema.sql`, `V2`) |
| **Templates** | Thymeleaf | 3.1.x | Server-rendered HTML5 layouts & fragments |
| **PDF Engine** | OpenPDF | 1.3.39 | Court-admissible forensic case dossier generation |
| **Cryptography** | Java MessageDigest | Built-in | NIST-compliant SHA-256 bitstream hashing |
| **Testing** | JUnit 5 & Mockito | 5.10.x | Unit and integration test coverage |
| **Frontend Portal** | React 19 & TailwindCSS 4 | Modern | Interactive real-time DFIR incident response console |

---

## 3. Database Schema (Flyway V1 & V2)

### Entity-Relationship Architecture:
1. `users`: Credentials, BCrypt hash, badge number, and role enum (`ADMIN`, `LEAD_INVESTIGATOR`, `FORENSIC_ANALYST`, `EVIDENCE_CUSTODIAN`).
2. `investigation_cases`: Primary dockets with case number, priority, status, category, and assigned investigator FK.
3. `evidence`: Seized digital artifacts linked to `investigation_cases`, containing original SHA-256 hash, locker ID, original filename, and size.
4. `evidence_hashes`: Audit history of all cryptographic verification runs (`MATCH` vs. `MISMATCH`), calculated hashes, and verifier info.
5. `chain_of_custody`: Immutable ledger of custody actions (`COLLECTED`, `TRANSFERRED`, `LAB_ANALYSIS`, `COURT_PRODUCTION`, `SECURE_STORAGE_DEPOSIT`), custodians, locations, and signature tokens.
6. `investigation_activities`: Chronological milestone journal for every case docket.
7. `audit_logs`: System-level security and access audit logs with IP addresses.

---

## 4. Local Setup & Execution Guide (For College Viva & Lab Machines)

### Prerequisites:
- Java Development Kit (JDK 21 LTS)
- Apache Maven 3.9+
- MySQL Server 8.0+

### Step 1: Clone and Configure Database
Log into MySQL and initialize the database:
```bash
mysql -u root -p
```
```sql
CREATE DATABASE IF NOT EXISTS cyber_forensics_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Update your database credentials in `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/cyber_forensics_db?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD
```

### Step 2: Build with Maven & Run Tests
Execute JUnit 5 tests to verify cryptographic hashing and custody workflows:
```bash
mvn clean test
```

### Step 3: Start Spring Boot Application
```bash
mvn spring-boot:run
```
Flyway will automatically execute `V1__init_schema.sql` and `V2__seed_demo_data.sql`, creating all tables, indexes, and initial case records.

### Step 4: Access Application
- Web UI: `http://localhost:8080`
- Default Accounts (Password: `Password@123`):
  - Administrator: `admin`
  - Lead Investigator: `investigator1`
  - Forensic Analyst: `analyst1`
  - Evidence Custodian: `custodian1`

---

## 5. College Viva Voce Defense Questions & Answers

**Q1: Why is SHA-256 used for digital forensics instead of MD5 or SHA-1?**  
*Answer:* MD5 and SHA-1 have known practical collision attacks where different payloads produce matching hashes. SHA-256 provides 256 bits of cryptographic entropy with zero known collisions. Any 1-bit alteration flips approximately 50% of the output bits (the *avalanche effect*), proving whether evidence was altered.

**Q2: What is Chain of Custody and why is it legally required?**  
*Answer:* Chain of Custody (CoC) is the chronological record of seizure, custody, transfer, analysis, and disposition of physical/electronic evidence. Under Rule 901 of the Federal Rules of Evidence and ISO/IEC 27037, an unbroken CoC establishes that evidence presented in trial is identical to what was seized at the crime scene.

**Q3: How does the system handle concurrent custody transfers?**  
*Answer:* Transfers execute within `@Transactional` boundaries using JPA entity locking and append-only database records, ensuring sequential timestamping and unforgeable digital signature tokens.
