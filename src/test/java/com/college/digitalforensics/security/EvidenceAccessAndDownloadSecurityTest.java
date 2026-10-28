package com.college.digitalforensics.security;

import com.college.digitalforensics.entity.*;
import com.college.digitalforensics.repository.*;
import com.college.digitalforensics.service.FileStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class EvidenceAccessAndDownloadSecurityTest {

    @Autowired
    private MockMvc mockMvc;

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

    @BeforeEach
    public void setup() {
        activityRepository.deleteAll();
        chainOfCustodyRepository.deleteAll();
        evidenceHashRepository.deleteAll();
        evidenceRepository.deleteAll();
        caseRepository.deleteAll();
        userRepository.deleteAll();

        User adminUser = User.builder()
                .username("admin")
                .fullName("System Administrator")
                .email("admin@evidentx.gov")
                .passwordHash("$2a$12$DummyHashForTestExecutionOnly")
                .role(Role.ADMIN)
                .activeStatus(true)
                .accountNonLocked(true)
                .build();
        adminUser = userRepository.save(adminUser);

        InvestigationCase c = InvestigationCase.builder()
                .caseNumber("CASE-SEC-001")
                .caseName("Operation Vault Guard")
                .category("CYBER_EXTORTION")
                .priority("HIGH")
                .assignedInvestigator(adminUser)
                .build();
        c = caseRepository.save(c);

        // Store a real test file in the vault
        byte[] payload = "CONFIDENTIAL FORENSIC DISK DUMP BYTES".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile mockFile = new MockMultipartFile("file", "evidence_dump.raw", "application/octet-stream", payload);
        FileStorageService.StoredFileResult stored = fileStorageService.storeFile(mockFile);

        Evidence ev = Evidence.builder()
                .evidenceNumber("EVD-SEC-999")
                .investigationCase(c)
                .evidenceName("Volatile RAM Sector 0")
                .evidenceType(EvidenceType.MEMORY_DUMP)
                .collector(adminUser)
                .collectorName("Admin")
                .collectionTimestamp(LocalDateTime.now())
                .originalSha256Hash(stored.getSha256Hash())
                .controlledStorageIdentifier("VAULT-SEC-01")
                .originalFilename("evidence_dump.raw")
                .fileSizeBytes((long) payload.length)
                .fileMimeType("application/octet-stream")
                .fileStoragePath(stored.getStoredPath())
                .verifiedStatus("VERIFIED_INTACT")
                .build();
        savedEvidence = evidenceRepository.save(ev);
    }

    @Test
    @DisplayName("Unauthenticated request to /evidence/{id}/download must redirect to /login")
    public void testUnauthenticatedDownloadFails() throws Exception {
        mockMvc.perform(get("/evidence/" + savedEvidence.getId() + "/download"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrlPattern("**/login"));
    }

    @Test
    @DisplayName("Authorized ADMIN downloading evidence gets 200 OK and binary payload stream")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testAuthorizedAdminCanDownloadEvidence() throws Exception {
        mockMvc.perform(get("/evidence/" + savedEvidence.getId() + "/download"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"evidence_dump.raw\""))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(content().bytes("CONFIDENTIAL FORENSIC DISK DUMP BYTES".getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    @DisplayName("Attempting to download non-existent evidence ID returns 400 Bad Request error page without stack trace")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testDownloadNonExistentEvidenceReturnsCleanError() throws Exception {
        mockMvc.perform(get("/evidence/999999/download"))
                .andExpect(status().isBadRequest());
    }
}
