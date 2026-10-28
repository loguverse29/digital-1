package com.college.digitalforensics.controller;

import com.college.digitalforensics.dto.CaseRequestDto;
import com.college.digitalforensics.entity.CaseStatus;
import com.college.digitalforensics.entity.InvestigationCase;
import com.college.digitalforensics.entity.User;
import com.college.digitalforensics.repository.InvestigationCaseRepository;
import com.college.digitalforensics.repository.UserRepository;
import com.college.digitalforensics.service.AuditService;
import com.college.digitalforensics.service.CaseService;
import com.college.digitalforensics.service.EvidenceSecurityService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/cases")
@RequiredArgsConstructor
public class CaseController {

    private final CaseService caseService;
    private final InvestigationCaseRepository caseRepository;
    private final UserRepository userRepository;
    private final EvidenceSecurityService securityService;
    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR', 'FORENSIC_ANALYST', 'EVIDENCE_CUSTODIAN')")
    public String listCases(@RequestParam(required = false) CaseStatus status,
                            @RequestParam(required = false) String category,
                            @RequestParam(required = false) String keyword,
                            @RequestParam(defaultValue = "0") int page,
                            @RequestParam(defaultValue = "10") int size,
                            Model model) {
        Page<InvestigationCase> casesPage = caseService.searchCases(
                status, category, keyword,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );

        model.addAttribute("casesPage", casesPage);
        model.addAttribute("currentStatus", status);
        model.addAttribute("currentCategory", category);
        model.addAttribute("keyword", keyword);
        return "cases/list";
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR', 'FORENSIC_ANALYST', 'EVIDENCE_CUSTODIAN')")
    public String viewCase(@PathVariable Long id, Authentication authentication, HttpServletRequest request, Model model) {
        if (!securityService.canAccessCase(authentication, id)) {
            throw new AccessDeniedException("Access Denied: You do not have clearance to view case dossier #" + id);
        }

        InvestigationCase c = caseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid case ID: " + id));

        String username = authentication != null ? authentication.getName() : "anonymous";
        auditService.log(null, username, "CASE_VIEWED", "Inspected Case docket " + c.getCaseNumber(), request.getRemoteAddr());

        model.addAttribute("caseItem", c);
        return "cases/details";
    }

    @GetMapping("/new")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR')")
    public String newCaseForm(Model model) {
        model.addAttribute("caseDto", new CaseRequestDto());
        model.addAttribute("investigators", userRepository.findByActiveStatusTrue());
        return "cases/create";
    }

    @PostMapping("/new")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR')")
    public String createCase(@Valid @ModelAttribute("caseDto") CaseRequestDto dto,
                             BindingResult result,
                             @AuthenticationPrincipal UserDetails userDetails,
                             Model model) {
        if (result.hasErrors()) {
            model.addAttribute("investigators", userRepository.findByActiveStatusTrue());
            return "cases/create";
        }
        User creator = userDetails != null ? userRepository.findByUsername(userDetails.getUsername()).orElse(null) : null;
        InvestigationCase saved = caseService.createCase(dto, creator);
        return "redirect:/cases/" + saved.getId();
    }
}
