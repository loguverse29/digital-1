package com.college.digitalforensics.service;

import com.college.digitalforensics.entity.Evidence;
import com.college.digitalforensics.entity.InvestigationCase;
import com.college.digitalforensics.entity.Role;
import com.college.digitalforensics.entity.User;
import com.college.digitalforensics.repository.EvidenceRepository;
import com.college.digitalforensics.repository.InvestigationCaseRepository;
import com.college.digitalforensics.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service("evidenceSecurityService")
@RequiredArgsConstructor
@Slf4j
public class EvidenceSecurityService {

    private final UserRepository userRepository;
    private final EvidenceRepository evidenceRepository;
    private final InvestigationCaseRepository caseRepository;

    public boolean canAccessCase(Authentication authentication, Long caseId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        String username = authentication.getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();
        if (user.getRole() == Role.ADMIN) {
            return true;
        }

        Optional<InvestigationCase> caseOpt = caseRepository.findById(caseId);
        if (caseOpt.isEmpty()) {
            return false;
        }

        InvestigationCase c = caseOpt.get();
        // Allowed if user is assigned investigator, or case is open to the department
        if (c.getAssignedInvestigator() != null && c.getAssignedInvestigator().getId().equals(user.getId())) {
            return true;
        }

        return user.getRole() == Role.LEAD_INVESTIGATOR || user.getRole() == Role.INVESTIGATOR;
    }

    public boolean canAccessEvidence(Authentication authentication, Long evidenceId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        String username = authentication.getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();
        if (user.getRole() == Role.ADMIN) {
            return true;
        }

        Optional<Evidence> evidenceOpt = evidenceRepository.findById(evidenceId);
        if (evidenceOpt.isEmpty()) {
            return false;
        }

        // Check if user has permission to access the parent case
        Evidence evidence = evidenceOpt.get();
        return canAccessCase(authentication, evidence.getInvestigationCase().getId())
                || user.getRole() == Role.FORENSIC_ANALYST
                || user.getRole() == Role.EVIDENCE_CUSTODIAN;
    }

    public boolean canDownloadEvidence(Authentication authentication, Long evidenceId) {
        return canAccessEvidence(authentication, evidenceId);
    }
}
