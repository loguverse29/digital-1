package com.college.digitalforensics.service;

import com.college.digitalforensics.dto.CustodyTransferDto;
import com.college.digitalforensics.entity.ChainOfCustody;
import com.college.digitalforensics.entity.Evidence;
import com.college.digitalforensics.entity.User;
import com.college.digitalforensics.repository.ChainOfCustodyRepository;
import com.college.digitalforensics.repository.EvidenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChainOfCustodyService {

    private final ChainOfCustodyRepository chainOfCustodyRepository;
    private final EvidenceRepository evidenceRepository;
    private final InvestigationActivityService activityService;
    private final AuditService auditService;

    @Transactional
    public ChainOfCustody recordTransfer(CustodyTransferDto dto, User actor) {
        Evidence evidence = evidenceRepository.findById(dto.getEvidenceId())
                .orElseThrow(() -> new IllegalArgumentException("Evidence item not found with ID: " + dto.getEvidenceId()));

        String token = dto.getCustodySignatureToken();
        if (token == null || token.isBlank()) {
            token = "SIG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        String actorName = actor != null ? actor.getFullName() : dto.getPreviousCustodian();

        ChainOfCustody record = ChainOfCustody.builder()
                .evidence(evidence)
                .investigationCase(evidence.getInvestigationCase())
                .actor(actor)
                .actorName(actorName)
                .action(dto.getAction())
                .previousCustodian(dto.getPreviousCustodian())
                .newCustodian(dto.getNewCustodian())
                .timestamp(LocalDateTime.now())
                .location(dto.getLocation() != null ? dto.getLocation() : "Evidence Storage Vault")
                .remarks(dto.getRemarks())
                .custodySignatureToken(token)
                .build();

        ChainOfCustody saved = chainOfCustodyRepository.save(record);

        // Update evidence storage identifier if new location given
        if (dto.getLocation() != null && !dto.getLocation().isBlank()) {
            evidence.setControlledStorageIdentifier(dto.getLocation());
            evidenceRepository.save(evidence);
        }

        // Log investigation activity
        String desc = String.format("Chain of Custody [%s]: Transferred from '%s' to '%s'. Token: %s",
                dto.getAction(), dto.getPreviousCustodian(), dto.getNewCustodian(), token);

        activityService.logActivity(evidence.getInvestigationCase(), evidence, actor,
                "CUSTODY_TRANSFER", desc);

        auditService.log(actor != null ? actor.getUsername() : "system",
                "CHAIN_OF_CUSTODY_TRANSFER",
                String.format("Evidence %s -> Custodian %s", evidence.getEvidenceNumber(), dto.getNewCustodian()));

        return saved;
    }

    public List<ChainOfCustody> getCustodyLedgerForEvidence(Long evidenceId) {
        return chainOfCustodyRepository.findByEvidenceIdOrderByTimestampAsc(evidenceId);
    }
}
