package com.college.digitalforensics.service;

import com.college.digitalforensics.entity.*;
import com.college.digitalforensics.repository.EvidenceHashRepository;
import com.college.digitalforensics.repository.EvidenceRepository;
import com.college.digitalforensics.util.HashGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EvidenceHashServiceTest {

    @Mock
    private EvidenceRepository evidenceRepository;

    @Mock
    private EvidenceHashRepository evidenceHashRepository;

    @Mock
    private InvestigationActivityService activityService;

    @Mock
    private AuditService auditService;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private EvidenceHashService hashService;

    private Evidence sampleEvidence;
    private User testUser;
    private String correctHash;

    @BeforeEach
    void setUp() {
        byte[] payload = "CONFIDENTIAL FORENSIC DISK BITSTREAM".getBytes(StandardCharsets.UTF_8);
        correctHash = HashGenerator.calculateSha256(payload);

        testUser = User.builder()
                .id(1L)
                .username("analyst1")
                .fullName("Elena Vance")
                .role(Role.FORENSIC_ANALYST)
                .build();

        sampleEvidence = Evidence.builder()
                .id(10L)
                .evidenceNumber("EVD-2026-0001")
                .originalSha256Hash(correctHash)
                .investigationCase(InvestigationCase.builder().id(100L).caseNumber("CASE-2026-01").build())
                .verifiedStatus("PENDING")
                .build();
    }

    @Test
    @DisplayName("Verify Integrity - Matching Hash returns MATCH and VERIFIED_INTACT status")
    void testVerifyIntegrity_Match() {
        when(evidenceRepository.findById(10L)).thenReturn(Optional.of(sampleEvidence));
        when(evidenceHashRepository.save(any(EvidenceHash.class))).thenAnswer(i -> i.getArgument(0));

        EvidenceHash result = hashService.verifyEvidenceIntegrity(10L, null, correctHash, "Regular audit", testUser);

        assertNotNull(result);
        assertEquals(VerificationOutcome.MATCH, result.getVerificationOutcome());
        assertEquals("VERIFIED_INTACT", sampleEvidence.getVerifiedStatus());
        verify(evidenceRepository).save(sampleEvidence);
        verify(activityService).logActivity(any(), any(), any(), eq("HASH_VERIFIED_INTACT"), anyString());
    }

    @Test
    @DisplayName("Verify Integrity - Tampered Hash returns MISMATCH and TAMPERED_MISMATCH status")
    void testVerifyIntegrity_Mismatch() {
        when(evidenceRepository.findById(10L)).thenReturn(Optional.of(sampleEvidence));
        when(evidenceHashRepository.save(any(EvidenceHash.class))).thenAnswer(i -> i.getArgument(0));

        String tamperedHash = "0000000000000000000000000000000000000000000000000000000000000000";

        EvidenceHash result = hashService.verifyEvidenceIntegrity(10L, null, tamperedHash, "Audit test", testUser);

        assertNotNull(result);
        assertEquals(VerificationOutcome.MISMATCH, result.getVerificationOutcome());
        assertEquals("TAMPERED_MISMATCH", sampleEvidence.getVerifiedStatus());
        verify(evidenceRepository).save(sampleEvidence);
        verify(activityService).logActivity(any(), any(), any(), eq("HASH_INTEGRITY_BREACH"), anyString());
    }
}
