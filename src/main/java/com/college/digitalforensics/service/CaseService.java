package com.college.digitalforensics.service;

import com.college.digitalforensics.dto.CaseRequestDto;
import com.college.digitalforensics.entity.CaseStatus;
import com.college.digitalforensics.entity.InvestigationCase;
import com.college.digitalforensics.entity.User;
import com.college.digitalforensics.repository.InvestigationCaseRepository;
import com.college.digitalforensics.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class CaseService {

    private final InvestigationCaseRepository caseRepository;
    private final UserRepository userRepository;
    private final InvestigationActivityService activityService;
    private final AuditService auditService;

    @Transactional
    public InvestigationCase createCase(CaseRequestDto dto, User creator) {
        String caseNumber = "CASE-" + LocalDateTime.now().getYear() + "-" + String.format("%04d", new Random().nextInt(10000));

        User assigned = null;
        String investigatorName = null;
        if (dto.getAssignedInvestigatorId() != null) {
            assigned = userRepository.findById(dto.getAssignedInvestigatorId()).orElse(null);
            if (assigned != null) {
                investigatorName = assigned.getFullName();
            }
        }

        InvestigationCase investigationCase = InvestigationCase.builder()
                .caseNumber(caseNumber)
                .caseName(dto.getCaseName())
                .description(dto.getDescription())
                .category(dto.getCategory())
                .priority(dto.getPriority() != null ? dto.getPriority() : "HIGH")
                .assignedInvestigator(assigned)
                .assignedInvestigatorName(investigatorName)
                .status(CaseStatus.OPEN)
                .incidentDate(dto.getIncidentDate() != null ? dto.getIncidentDate() : LocalDateTime.now())
                .courtJurisdiction(dto.getCourtJurisdiction())
                .build();

        InvestigationCase saved = caseRepository.save(investigationCase);

        activityService.logActivity(saved, null, creator, "CASE_OPENED",
                "Investigation opened: " + dto.getCaseName() + " (Category: " + dto.getCategory() + ")");

        auditService.log(creator != null ? creator.getUsername() : "system",
                "CASE_CREATED", "Opened new case file: " + caseNumber);

        return saved;
    }

    @Transactional
    public InvestigationCase updateStatus(Long caseId, CaseStatus newStatus, User modifier) {
        InvestigationCase c = caseRepository.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        CaseStatus prev = c.getStatus();
        c.setStatus(newStatus);
        InvestigationCase updated = caseRepository.save(c);

        activityService.logActivity(c, null, modifier, "CASE_STATUS_CHANGED",
                "Case status transitioned from " + prev + " to " + newStatus);

        auditService.log(modifier != null ? modifier.getUsername() : "system",
                "CASE_STATUS_UPDATED", c.getCaseNumber() + " -> " + newStatus);

        return updated;
    }

    public Page<InvestigationCase> searchCases(CaseStatus status, String category, String keyword, Pageable pageable) {
        return caseRepository.searchCases(status, category, keyword, pageable);
    }
}
