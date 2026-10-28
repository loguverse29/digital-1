package com.college.digitalforensics.service;

import com.college.digitalforensics.entity.*;
import com.college.digitalforensics.repository.EvidenceHashRepository;
import com.college.digitalforensics.repository.EvidenceRepository;
import com.college.digitalforensics.util.HashGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class EvidenceHashService {

    private final EvidenceRepository evidenceRepository;
    private final EvidenceHashRepository evidenceHashRepository;
    private final InvestigationActivityService activityService;
    private final AuditService auditService;
    private final FileStorageService fileStorageService;

    /**
     * Verifies the cryptographic integrity of an evidence item by computing its current SHA-256
     * hash against its original baseline hash from actual stored bytes or uploaded file.
     */
    @Transactional
    public EvidenceHash verifyEvidenceIntegrity(Long evidenceId, MultipartFile file, String manualHash, String notes, User verifyingUser) {
        Evidence evidence = evidenceRepository.findById(evidenceId)
                .orElseThrow(() -> new IllegalArgumentException("Evidence item not found with ID: " + evidenceId));

        String calculatedHash;
        if (file != null && !file.isEmpty()) {
            try {
                calculatedHash = HashGenerator.calculateSha256(file.getInputStream());
            } catch (IOException e) {
                log.error("Failed to compute SHA-256 for evidence upload", e);
                throw new RuntimeException("Error reading evidence byte stream for SHA-256 calculation", e);
            }
        } else if (evidence.getFileStoragePath() != null && !evidence.getFileStoragePath().isBlank()) {
            // Compute directly from actual stored physical bytes in forensics vault
            byte[] storedBytes = fileStorageService.loadStoredBytes(evidence.getFileStoragePath());
            calculatedHash = HashGenerator.calculateSha256(storedBytes);
            if (notes == null || notes.isBlank()) {
                notes = "Automated integrity verification computed against actual stored vault bytes.";
            }
        } else if (manualHash != null && !manualHash.isBlank()) {
            calculatedHash = manualHash.trim().toLowerCase();
        } else {
            throw new IllegalArgumentException("No stored evidence file or verification payload available to compute hash");
        }

        String originalHash = evidence.getOriginalSha256Hash().toLowerCase().trim();
        boolean isMatch = originalHash.equalsIgnoreCase(calculatedHash);
        VerificationOutcome outcome = isMatch ? VerificationOutcome.MATCH : VerificationOutcome.MISMATCH;

        String verifierName = verifyingUser != null ? verifyingUser.getFullName() : "Automated Forensic Engine";

        EvidenceHash record = EvidenceHash.builder()
                .evidence(evidence)
                .algorithm("SHA-256")
                .originalHash(originalHash)
                .calculatedHash(calculatedHash)
                .verificationOutcome(outcome)
                .verificationTimestamp(LocalDateTime.now())
                .verifyingUser(verifyingUser)
                .verifyingUserName(verifierName)
                .notes(notes)
                .build();

        evidenceHashRepository.save(record);

        // Update evidence status
        if (isMatch) {
            evidence.setVerifiedStatus("VERIFIED_INTACT");
            log.info("Evidence [{}] integrity verified intact with hash {}", evidence.getEvidenceNumber(), calculatedHash);
        } else {
            evidence.setVerifiedStatus("TAMPERED_MISMATCH");
            log.warn("SECURITY ALERT: Cryptographic hash mismatch on Evidence [{}]! Expected: {}, Found: {}",
                    evidence.getEvidenceNumber(), originalHash, calculatedHash);
        }
        evidence.setLastVerificationTimestamp(LocalDateTime.now());
        evidenceRepository.save(evidence);

        // Log investigation activity
        String desc = isMatch
                ? String.format("Cryptographic verification passed. SHA-256 match (%s).", calculatedHash.substring(0, 16) + "...")
                : String.format("CRITICAL ALERT: Evidence hash mismatch! Calculated: %s vs Original: %s. Chain of custody compromised.",
                calculatedHash.substring(0, 16) + "...", originalHash.substring(0, 16) + "...");

        activityService.logActivity(evidence.getInvestigationCase(), evidence, verifyingUser,
                isMatch ? "HASH_VERIFIED_INTACT" : "HASH_INTEGRITY_BREACH", desc);

        auditService.log(verifyingUser != null ? verifyingUser.getUsername() : "system",
                "EVIDENCE_HASH_VERIFICATION",
                String.format("Evidence: %s, Outcome: %s", evidence.getEvidenceNumber(), outcome));

        return record;
    }

    /**
     * Specifically executes SHA-256 verification directly against the physical file stored in the vault.
     */
    @Transactional
    public EvidenceHash verifyPhysicalStoredEvidence(Long evidenceId, User verifyingUser) {
        return verifyEvidenceIntegrity(evidenceId, null, null, "Live SHA-256 byte-parity audit from secure vault storage.", verifyingUser);
    }
}
