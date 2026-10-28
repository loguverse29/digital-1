package com.college.digitalforensics.service;

import com.college.digitalforensics.dto.EvidenceUploadDto;
import com.college.digitalforensics.entity.*;
import com.college.digitalforensics.repository.EvidenceHashRepository;
import com.college.digitalforensics.repository.EvidenceRepository;
import com.college.digitalforensics.repository.InvestigationCaseRepository;
import com.college.digitalforensics.service.FileStorageService.StoredFileResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class EvidenceService {

    private final EvidenceRepository evidenceRepository;
    private final EvidenceHashRepository evidenceHashRepository;
    private final InvestigationCaseRepository caseRepository;
    private final InvestigationActivityService activityService;
    private final ChainOfCustodyService chainOfCustodyService;
    private final AuditService auditService;
    private final FileStorageService fileStorageService;

    @Transactional
    public Evidence registerEvidence(EvidenceUploadDto dto, User collector) {
        InvestigationCase investigationCase = caseRepository.findById(dto.getCaseId())
                .orElseThrow(() -> new IllegalArgumentException("Case not found with ID: " + dto.getCaseId()));

        String sha256;
        String originalFilename;
        String storedPath = null;
        long sizeBytes = 0;
        String mimeType = "application/octet-stream";

        MultipartFile file = dto.getFile();
        if (file != null && !file.isEmpty()) {
            // Secure file storage outside public web directory with format & signature checks
            StoredFileResult storageResult = fileStorageService.storeFile(file);
            sha256 = storageResult.getSha256Hash();
            originalFilename = storageResult.getOriginalFilename();
            storedPath = storageResult.getStoredPath();
            sizeBytes = storageResult.getFileSizeBytes();
            mimeType = storageResult.getFileMimeType();
        } else if (dto.getPrecomputedSha256() != null && !dto.getPrecomputedSha256().isBlank()) {
            sha256 = dto.getPrecomputedSha256().trim().toLowerCase();
            originalFilename = dto.getEvidenceName().replaceAll("\\s+", "_").toLowerCase() + ".dat";
        } else {
            throw new IllegalArgumentException("Evidence requires a physical file upload or precomputed SHA-256 hash");
        }

        String evidenceNumber = "EVD-" + LocalDateTime.now().getYear() + "-" + String.format("%04d", new Random().nextInt(10000));
        String collectorName = collector != null ? collector.getFullName() : "Field Evidence Officer";

        Evidence evidence = Evidence.builder()
                .evidenceNumber(evidenceNumber)
                .investigationCase(investigationCase)
                .evidenceName(dto.getEvidenceName())
                .evidenceType(dto.getEvidenceType())
                .description(dto.getDescription())
                .sourceDevice(dto.getSourceDevice())
                .collector(collector)
                .collectorName(collectorName)
                .collectionTimestamp(dto.getCollectionTimestamp())
                .originalSha256Hash(sha256)
                .controlledStorageIdentifier(dto.getControlledStorageIdentifier())
                .originalFilename(originalFilename)
                .fileSizeBytes(sizeBytes)
                .fileMimeType(mimeType)
                .fileStoragePath(storedPath)
                .verifiedStatus("VERIFIED_INTACT")
                .lastVerificationTimestamp(LocalDateTime.now())
                .build();

        Evidence saved = evidenceRepository.save(evidence);

        // Initial baseline hash record
        EvidenceHash baselineHash = EvidenceHash.builder()
                .evidence(saved)
                .algorithm("SHA-256")
                .originalHash(sha256)
                .calculatedHash(sha256)
                .verificationOutcome(VerificationOutcome.MATCH)
                .verifyingUser(collector)
                .verifyingUserName(collectorName)
                .notes("Baseline cryptographic fingerprint recorded during ingestion.")
                .build();
        evidenceHashRepository.save(baselineHash);

        // Initial Chain of Custody entry
        com.college.digitalforensics.dto.CustodyTransferDto initialCustody = com.college.digitalforensics.dto.CustodyTransferDto.builder()
                .evidenceId(saved.getId())
                .action(CustodyAction.COLLECTED)
                .previousCustodian("Incident Scene / Seizure Site")
                .newCustodian(collectorName)
                .location(dto.getControlledStorageIdentifier())
                .remarks("Initial intake and cryptographic hashing.")
                .build();
        chainOfCustodyService.recordTransfer(initialCustody, collector);

        activityService.logActivity(investigationCase, saved, collector, "EVIDENCE_SEIZED",
                String.format("Evidence [%s] ingested with baseline SHA-256: %s", evidenceNumber, sha256.substring(0, 16) + "..."));

        auditService.log(collector != null ? collector.getUsername() : "system",
                "EVIDENCE_REGISTERED",
                String.format("Evidence %s for Case %s (Vault Path: %s)", evidenceNumber, investigationCase.getCaseNumber(), storedPath != null ? "VAULT_SECURED" : "PRECOMPUTED"));

        return saved;
    }

    public Page<Evidence> searchEvidence(Long caseId, EvidenceType type, String status, String keyword, Pageable pageable) {
        return evidenceRepository.searchEvidence(caseId, type, status, keyword, pageable);
    }
}
