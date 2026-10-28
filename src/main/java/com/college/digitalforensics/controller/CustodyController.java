package com.college.digitalforensics.controller;

import com.college.digitalforensics.dto.CustodyTransferDto;
import com.college.digitalforensics.entity.User;
import com.college.digitalforensics.repository.ChainOfCustodyRepository;
import com.college.digitalforensics.repository.EvidenceRepository;
import com.college.digitalforensics.repository.UserRepository;
import com.college.digitalforensics.service.ChainOfCustodyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/custody")
@RequiredArgsConstructor
public class CustodyController {

    private final ChainOfCustodyService custodyService;
    private final ChainOfCustodyRepository custodyRepository;
    private final EvidenceRepository evidenceRepository;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR', 'FORENSIC_ANALYST', 'EVIDENCE_CUSTODIAN')")
    public String listCustody(@RequestParam(defaultValue = "0") int page, Model model) {
        model.addAttribute("custodyPage", custodyRepository.findAllByOrderByTimestampDesc(PageRequest.of(page, 15)));
        return "custody/list";
    }

    @GetMapping("/transfer")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR', 'EVIDENCE_CUSTODIAN')")
    public String transferForm(@RequestParam(required = false) Long evidenceId, Model model) {
        CustodyTransferDto dto = new CustodyTransferDto();
        dto.setEvidenceId(evidenceId);
        model.addAttribute("custodyDto", dto);
        model.addAttribute("evidenceList", evidenceRepository.findAll());
        return "custody/transfer";
    }

    @PostMapping("/transfer")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR', 'EVIDENCE_CUSTODIAN')")
    public String executeTransfer(@Valid @ModelAttribute("custodyDto") CustodyTransferDto dto,
                                  BindingResult result,
                                  @AuthenticationPrincipal UserDetails userDetails,
                                  Model model,
                                  RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            model.addAttribute("evidenceList", evidenceRepository.findAll());
            return "custody/transfer";
        }
        User actor = userDetails != null ? userRepository.findByUsername(userDetails.getUsername()).orElse(null) : null;
        custodyService.recordTransfer(dto, actor);
        redirectAttributes.addFlashAttribute("successMessage", "Chain of Custody updated with immutable audit entry.");
        return "redirect:/custody";
    }
}
