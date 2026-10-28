-- ===================================================================
-- Flyway Database Migration V2: Realistic Cyber Investigation Seed Data
-- Passwords are encrypted with BCrypt ($2a$10$...) for "Password@123"
-- ===================================================================

-- 1. Insert Initial Users
INSERT INTO users (id, username, full_name, email, password_hash, role, badge_number, active_status) VALUES
(1, 'admin', 'Dr. Sarah Chen', 'schen@forensics.gov', '$2a$10$Dow1YdG5yD0q7b7fN9G4sO3tLw7e3B.Jk4N4b4e9E9a9e3A0s7uTC', 'ADMIN', 'CYBER-DIR-01', TRUE),
(2, 'investigator1', 'Insp. Rajesh Kumar', 'rkumar@forensics.gov', '$2a$10$Dow1YdG5yD0q7b7fN9G4sO3tLw7e3B.Jk4N4b4e9E9a9e3A0s7uTC', 'LEAD_INVESTIGATOR', 'INV-LEAD-402', TRUE),
(3, 'analyst1', 'Elena Vance', 'evance@forensics.gov', '$2a$10$Dow1YdG5yD0q7b7fN9G4sO3tLw7e3B.Jk4N4b4e9E9a9e3A0s7uTC', 'FORENSIC_ANALYST', 'LAB-SPEC-118', TRUE),
(4, 'custodian1', 'Marcus Thorne', 'mthorne@forensics.gov', '$2a$10$Dow1YdG5yD0q7b7fN9G4sO3tLw7e3B.Jk4N4b4e9E9a9e3A0s7uTC', 'EVIDENCE_CUSTODIAN', 'SEC-VAULT-89', TRUE);

-- 2. Insert Investigation Cases
INSERT INTO investigation_cases (id, case_number, case_name, description, category, priority, assigned_investigator_id, assigned_investigator_name, status, incident_date, court_jurisdiction) VALUES
(1, 'CASE-2026-0814', 'Operation BlackByte: Hospital Ransomware Attack', 'Targeted double-extortion ransomware payload deployment disrupting ICU telemetry servers and exfiltrating patient PII.', 'RANSOMWARE', 'CRITICAL', 2, 'Insp. Rajesh Kumar', 'IN_PROGRESS', '2026-09-14 02:45:00', 'Federal District Court - Eastern District'),
(2, 'CASE-2026-0922', 'Project Chimera: FinTech Insider Intellectual Property Exfiltration', 'Senior quant developer exfiltrated proprietary HFT algorithmic trading models and core crypto gateway signatures before resigning.', 'INSIDER_THREAT', 'HIGH', 2, 'Insp. Rajesh Kumar', 'OPEN', '2026-10-02 18:20:00', 'High Court of Cyber Appeals'),
(3, 'CASE-2026-0509', 'DarkMarket Hydra: Synthetic Identity Laundering', 'Distributed criminal ring generating synthetic financial identities using AI deepfakes and laundering proceeds across decentralized bridges.', 'FINANCIAL_FRAUD', 'MEDIUM', 2, 'Insp. Rajesh Kumar', 'CLOSED', '2026-05-09 11:15:00', 'State Special Cyber Tribunal');

-- 3. Insert Evidence Items with Real SHA-256 Hashes
INSERT INTO evidence (id, evidence_number, case_id, evidence_name, evidence_type, description, source_device, collector_id, collector_name, collection_timestamp, original_sha256_hash, controlled_storage_identifier, original_filename, file_size_bytes, file_mime_type, verified_status, last_verification_timestamp) VALUES
(1, 'EVD-2026-9041', 1, 'Domain Controller Volatile RAM Dump', 'MEMORY_DUMP', 'Volatile memory dump captured via LiME from compromised Primary Domain Controller (DC-01) during active ransomware execution.', 'HP ProLiant DL380 Server DC-01', 3, 'Elena Vance', '2026-09-14 04:12:00', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'SECURE-VAULT-BAY-01', 'dc01_lime_physmem.raw', 34359738368, 'application/octet-stream', 'VERIFIED_INTACT', '2026-10-18 10:15:00'),
(2, 'EVD-2026-9042', 1, 'C2 Beacon Network Packet Capture', 'NETWORK_PCAP', 'Promiscuous network packet capture spanning gateway egress during initial Cobalt Strike lateral movement stage.', 'Palo Alto Perimeter Firewall ETH-2', 3, 'Elena Vance', '2026-09-14 05:40:00', 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb', 'SECURE-VAULT-BAY-01', 'egress_c2_traffic_20260914.pcapng', 2147483648, 'application/vnd.tcpdump.pcap', 'VERIFIED_INTACT', '2026-10-19 14:30:00'),
(3, 'EVD-2026-9043', 2, 'Seized Engineer Workstation NVMe Drive', 'DISK_IMAGE', 'Forensic bitstream duplicate image (E01) extracted from suspect Samsung 990 Pro NVMe solid state drive.', 'Lenovo ThinkPad P16 Serial #LNV-99821', 4, 'Marcus Thorne', '2026-10-03 09:30:00', '4e1243bd22c66e76c2ba9eddc1f91394e57f9f835f818817282cb8d655f52ce7', 'EVIDENCE-LOCKER-B12', 'suspect_nvme_drive.e01', 1073741824000, 'application/octet-stream', 'VERIFIED_INTACT', '2026-10-15 16:00:00'),
(4, 'EVD-2026-9044', 2, 'Air-Gapped Hardware Ledger USB Storage', 'ENCRYPTED_MEDIA', 'SanDisk Extreme 128GB USB found taped beneath suspect office desk containing PGP-encrypted tarball of trading repo.', 'SanDisk Extreme USB 128GB', 2, 'Insp. Rajesh Kumar', '2026-10-03 14:15:00', 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d', 'EVIDENCE-LOCKER-B14', 'exfil_hft_archive.enc', 8589934592, 'application/octet-stream', 'VERIFIED_INTACT', '2026-10-20 09:45:00');

-- 4. Evidence Hash Verifications
INSERT INTO evidence_hashes (id, evidence_id, algorithm, original_hash, calculated_hash, verification_outcome, verification_timestamp, verifying_user_id, verifying_user_name, notes) VALUES
(1, 1, 'SHA-256', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'MATCH', '2026-09-14 06:00:00', 3, 'Elena Vance', 'Initial cryptographic baseline established upon ingest into evidence locker.'),
(2, 1, 'SHA-256', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'MATCH', '2026-10-18 10:15:00', 3, 'Elena Vance', 'Routine chain-of-custody audit verification. Hash identical. Zero bit rot or tampering detected.'),
(3, 3, 'SHA-256', '4e1243bd22c66e76c2ba9eddc1f91394e57f9f835f818817282cb8d655f52ce7', '4e1243bd22c66e76c2ba9eddc1f91394e57f9f835f818817282cb8d655f52ce7', 'MATCH', '2026-10-15 16:00:00', 4, 'Marcus Thorne', 'Pre-court verification check confirmed valid SHA-256 checksum.');

-- 5. Chain of Custody Immutable Records
INSERT INTO chain_of_custody (id, evidence_id, case_id, actor_id, actor_name, action, previous_custodian, new_custodian, timestamp, location, remarks, custody_signature_token) VALUES
(1, 1, 1, 3, 'Elena Vance', 'COLLECTED', 'None (Incident Scene)', 'Elena Vance (Forensic Lab)', '2026-09-14 04:12:00', 'St. Jude Datacenter Server Room C', 'Memory acquisition performed with hardware write-blocker attached.', 'SIG-COLLECT-VANCE-8812'),
(2, 1, 1, 4, 'Marcus Thorne', 'SECURE_STORAGE_DEPOSIT', 'Elena Vance', 'Marcus Thorne (Evidence Custodian)', '2026-09-14 07:30:00', 'Evidence Control Central Vault Bay 01', 'Transferred to controlled climate locker under tamper-evident seal #77192.', 'SIG-CUSTODY-THORNE-9901'),
(3, 1, 1, 3, 'Elena Vance', 'LAB_ANALYSIS', 'Marcus Thorne', 'Elena Vance (Forensic Lab)', '2026-10-18 09:30:00', 'Digital Forensics Lab Workstation Alpha', 'Checked out for Volatility 3 framework memory analysis and malfind execution.', 'SIG-LAB-VANCE-9021'),
(4, 3, 2, 4, 'Marcus Thorne', 'COLLECTED', 'Suspect Desk (FinTech HQ)', 'Marcus Thorne', '2026-10-03 09:30:00', 'FinTech Alpha 42nd Floor', 'Seized under Federal Search Warrant #2026-SW-119.', 'SIG-SEIZE-THORNE-4412'),
(5, 3, 2, 2, 'Insp. Rajesh Kumar', 'TRANSFERRED', 'Marcus Thorne', 'Insp. Rajesh Kumar', '2026-10-15 15:45:00', 'Special Investigation Headquarters', 'Handed over for lead prosecutor case briefing and trial prep.', 'SIG-XFER-KUMAR-3391');

-- 6. Investigation Activities
INSERT INTO investigation_activities (id, case_id, evidence_id, actor_id, actor_name, activity_type, activity_description, timestamp) VALUES
(1, 1, NULL, 2, 'Insp. Rajesh Kumar', 'CASE_INITIATED', 'Case registered following notification from Federal Cybersecurity Emergency Response Center.', '2026-09-14 03:00:00'),
(2, 1, 1, 3, 'Elena Vance', 'EVIDENCE_INGESTED', 'Acquired LiME memory capture from Domain Controller 01 with baseline SHA-256 generation.', '2026-09-14 04:30:00'),
(3, 1, 2, 3, 'Elena Vance', 'PCAP_DEEP_INSPECTION', 'Identified HTTPS C2 beaconing to external IP 194.26.29.112 matching BlackByte APT threat actor signatures.', '2026-09-15 11:20:00'),
(4, 2, NULL, 2, 'Insp. Rajesh Kumar', 'SEARCH_WARRANT_EXECUTED', 'Executed judicially authorized search warrant at FinTech Alpha headquarters; seized suspect primary laptop and encrypted media.', '2026-10-03 09:00:00'),
(5, 2, 3, 3, 'Elena Vance', 'FORENSIC_TRIAGE', 'Completed Autopsy analysis of E01 drive image; recovered deleted Git commit logs containing proprietary pricing equations.', '2026-10-10 14:00:00');

-- 7. Audit Logs
INSERT INTO audit_logs (id, user_id, username, action, details, ip_address, timestamp) VALUES
(1, 1, 'admin', 'USER_LOGIN', 'System Administrator logged in from security console.', '10.0.4.15', '2026-10-21 07:00:00'),
(2, 2, 'investigator1', 'CASE_VIEWED', 'Viewed case file CASE-2026-0814.', '10.0.4.22', '2026-10-21 07:05:00'),
(3, 3, 'analyst1', 'HASH_VERIFICATION', 'Triggered SHA-256 verification on evidence item EVD-2026-9041: Integrity confirmed MATCH.', '10.0.4.30', '2026-10-21 07:10:00'),
(4, 4, 'custodian1', 'CHAIN_OF_CUSTODY_UPDATED', 'Logged custody transfer record #5 for NVMe image EVD-2026-9043.', '10.0.4.35', '2026-10-21 07:12:00');
