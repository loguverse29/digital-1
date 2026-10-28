package com.college.digitalforensics.security;

import com.college.digitalforensics.entity.*;
import com.college.digitalforensics.repository.*;
import com.college.digitalforensics.service.EvidenceHashService;
import com.college.digitalforensics.service.FileStorageService;
import com.college.digitalforensics.util.HashGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class EvidenceIntegrityMismatchSecurityTest {

    @Autowired
    private EvidenceHashService hashService;

    @Autowired
    private EvidenceRepository evidenceRepository;

    @Autowired
    private InvestigationCaseRepository caseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EvidenceHashRepository evidenceHashRepository;

    @Autowired
    private ChainOfCustodyRepository chainOfCustodyRepository;

    @Autowired
    private InvestigationActivityRepository activityRepository;

    @Autowired
    private FileStorageService fileStorageService;

    private Evidence savedEvidence;
    private User testUser;
    private String baselineSha256;

    @BeforeEach
    public void setup() {
        activityRepository.deleteAll();
        chainOfCustodyRepository.deleteAll();
        evidenceHashRepository.deleteAll();
        evidenceRepository.deleteAll();
        caseRepository.deleteAll();
        userRepository.deleteAll();

        testUser = User.builder()
                .username("analyst_test")
                .fullName("Forensic Examiner")
                .email("examiner@evidentx.gov")
                .passwordHash("DummyPasswordHash123")
                .role(Role.FORENSIC_ANALYST)
                .activeStatus(true)
                .accountNonLocked(true)
                .build();
        testUser = userRepository.save(testUser);

        InvestigationCase c = InvestigationCase.builder()
                .caseNumber("CASE-HASH-001")
                .caseName("Integrity Assurance Trial")
                .category("INTRUSION")
                .priority("HIGH")
                .build();
        c = caseRepository.save(c);

        byte[] originalPayload = "ORIGINAL AUTHENTIC BITSTREAM FROM SEIZED WORKSTATION".getBytes(StandardCharsets.UTF_8);
        baselineSha256 = HashGenerator.calculateSha256(originalPayload);

        MockMultipartFile mockFile = new MockMultipartFile("file", "bitstream.raw", "application/octet-stream", originalPayload);
        FileStorageService.StoredFileResult stored = fileStorageService.storeFile(mockFile);

        Evidence ev = Evidence.builder()
                .evidenceNumber("EVD-HASH-100")
                .investigationCase(c)
                .evidenceName("Primary Drive Sector")
                .evidenceType(EvidenceType.DISK_IMAGE)
                .collector(testUser)
                .collectorName("Examiner")
                .collectionTimestamp(LocalDateTime.now())
                .originalSha256Hash(baselineSha256)
                .controlledStorageIdentifier("SEC-BAY-09")
                .originalFilename("bitstream.raw")
                .fileStoragePath(stored.getStoredPath())
                .fileSizeBytes((long) originalPayload.length)
                .verifiedStatus("PENDING")
                .build();
        savedEvidence = evidenceRepository.save(ev);
    }

    @Test
    @DisplayName("Integrity verification against unchanged physical vault file produces MATCH and VERIFIED_INTACT")
    public void testIntegrityVerification_AuthenticMatch() {
        EvidenceHash hashResult = hashService.verifyPhysicalStoredEvidence(savedEvidence.getId(), testUser);

        assertNotNull(hashResult);
        assertEquals(VerificationOutcome.MATCH, hashResult.getVerificationOutcome());
        assertEquals(baselineSha256, hashResult.getCalculatedHash());

        Evidence reloaded = evidenceRepository.findById(savedEvidence.getId()).orElseThrow();
        assertEquals("VERIFIED_INTACT", reloaded.getVerifiedStatus());
    }

    @Test
    @DisplayName("Integrity verification with even a 1-bit altered file produces MISMATCH and flags TAMPERED_MISMATCH")
    public void testIntegrityVerification_TamperedMismatch() {
        // Alter 1 character in the bitstream payload
        byte[] tamperedPayload = "ORIGINAL AUTHENTIC BITSTREAM FROM SEIZED WORKSTATIOX".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile tamperedFile = new MockMultipartFile("file", "bitstream.raw", "application/octet-stream", tamperedPayload);

        EvidenceHash hashResult = hashService.verifyEvidenceIntegrity(savedEvidence.getId(), tamperedFile, null, "Tamper simulation check", testUser);

        assertNotNull(hashResult);
        assertEquals(VerificationOutcome.MISMATCH, hashResult.getVerificationOutcome());
        assertNotEquals(baselineSha256, hashResult.getCalculatedHash());

        Evidence reloaded = evidenceRepository.findById(savedEvidence.getId()).orElseThrow();
        assertEquals("TAMPERED_MISMATCH", reloaded.getVerifiedStatus());
    }
}
