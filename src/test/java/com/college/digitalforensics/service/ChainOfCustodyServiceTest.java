package com.college.digitalforensics.service;

import com.college.digitalforensics.dto.CustodyTransferDto;
import com.college.digitalforensics.entity.*;
import com.college.digitalforensics.repository.ChainOfCustodyRepository;
import com.college.digitalforensics.repository.EvidenceRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChainOfCustodyServiceTest {

    @Mock
    private ChainOfCustodyRepository chainOfCustodyRepository;

    @Mock
    private EvidenceRepository evidenceRepository;

    @Mock
    private InvestigationActivityService activityService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ChainOfCustodyService custodyService;

    @Test
    @DisplayName("Record Custody Transfer - Records immutable entry with digital signature")
    void testRecordTransfer_Success() {
        InvestigationCase c = InvestigationCase.builder().id(1L).caseNumber("CASE-2026-001").build();
        Evidence ev = Evidence.builder().id(5L).evidenceNumber("EVD-2026-9041").investigationCase(c).build();

        when(evidenceRepository.findById(5L)).thenReturn(Optional.of(ev));
        when(chainOfCustodyRepository.save(any(ChainOfCustody.class))).thenAnswer(i -> i.getArgument(0));

        CustodyTransferDto dto = CustodyTransferDto.builder()
                .evidenceId(5L)
                .action(CustodyAction.LAB_ANALYSIS)
                .previousCustodian("Vault Custodian")
                .newCustodian("Lead Examiner Vance")
                .location("Forensics Workstation 4")
                .remarks("Memory analysis checkout")
                .build();

        ChainOfCustody result = custodyService.recordTransfer(dto, null);

        assertNotNull(result);
        assertEquals(CustodyAction.LAB_ANALYSIS, result.getAction());
        assertEquals("Vault Custodian", result.getPreviousCustodian());
        assertEquals("Lead Examiner Vance", result.getNewCustodian());
        assertNotNull(result.getCustodySignatureToken());
        verify(chainOfCustodyRepository).save(any(ChainOfCustody.class));
    }
}
