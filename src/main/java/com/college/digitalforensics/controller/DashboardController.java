package com.college.digitalforensics.controller;

import com.college.digitalforensics.dto.DashboardStatsDto;
import com.college.digitalforensics.entity.CaseStatus;
import com.college.digitalforensics.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequiredArgsConstructor
public class DashboardController {

    private final InvestigationCaseRepository caseRepository;
    private final EvidenceRepository evidenceRepository;
    private final ChainOfCustodyRepository custodyRepository;
    private final InvestigationActivityRepository activityRepository;

    @GetMapping({"/", "/dashboard"})
    public String dashboard(Model model) {
        model.addAttribute("stats", getDashboardStats());
        model.addAttribute("recentCases", caseRepository.findAll().stream().limit(5).toList());
        model.addAttribute("recentActivities", activityRepository.findAll().stream().limit(10).toList());
        return "dashboard/index";
    }

    @GetMapping("/api/dashboard/stats")
    @ResponseBody
    public DashboardStatsDto getDashboardStats() {
        return DashboardStatsDto.builder()
                .totalCases(caseRepository.count())
                .openCases(caseRepository.countByStatus(CaseStatus.OPEN))
                .inProgressCases(caseRepository.countByStatus(CaseStatus.IN_PROGRESS))
                .closedCases(caseRepository.countByStatus(CaseStatus.CLOSED))
                .totalEvidence(evidenceRepository.count())
                .verifiedIntactEvidence(evidenceRepository.countByVerifiedStatus("VERIFIED_INTACT"))
                .tamperedOrFlaggedEvidence(evidenceRepository.countByVerifiedStatus("TAMPERED_MISMATCH"))
                .totalCustodyTransfers(custodyRepository.count())
                .totalActivities(activityRepository.count())
                .build();
    }
}
