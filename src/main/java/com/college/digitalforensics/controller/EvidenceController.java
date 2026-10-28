package com.college.digitalforensics.controller;

import com.college.digitalforensics.dto.CustodyTransferDto;
import com.college.digitalforensics.dto.EvidenceUploadDto;
import com.college.digitalforensics.dto.HashVerificationDto;
import com.college.digitalforensics.entity.CustodyAction;
import com.college.digitalforensics.entity.Evidence;
import com.college.digitalforensics.entity.User;
import com.college.digitalforensics.repository.EvidenceHashRepository;
import com.college.digitalforensics.repository.EvidenceRepository;
import com.college.digitalforensics.repository.InvestigationCaseRepository;
import com.college.digitalforensics.repository.UserRepository;
import com.college.digitalforensics.service.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/evidence")
@RequiredArgsConstructor
@Slf4j
public class EvidenceController {

    private final EvidenceService evidenceService;
    private final EvidenceHashService evidenceHashService;
    private final EvidenceRepository evidenceRepository;
    private final EvidenceHashRepository hashRepository;
    private final InvestigationCaseRepository caseRepository;
    private final UserRepository userRepository;
    private final EvidenceSecurityService securityService;
    private final FileStorageService fileStorageService;
    private final AuditService auditService;
    private final ChainOfCustodyService custodyService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR', 'FORENSIC_ANALYST', 'EVIDENCE_CUSTODIAN')")
    public String listAllEvidence(Model model) {
        model.addAttribute("evidenceList", evidenceRepository.findAll());
        return "evidence/list";
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR', 'FORENSIC_ANALYST', 'EVIDENCE_CUSTODIAN')")
    public String viewEvidence(@PathVariable Long id, Authentication authentication, Model model) {
        if (!securityService.canAccessEvidence(authentication, id)) {
            throw new AccessDeniedException("Access Denied: You are not authorized to view evidence #" + id);
        }

        Evidence ev = evidenceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid evidence ID: " + id));

        // Audit log view access
        String username = authentication != null ? authentication.getName() : "anonymous";
        auditService.log(null, username, "EVIDENCE_VIEWED", "Inspected details for evidence " + ev.getEvidenceNumber(), "127.0.0.1");

        model.addAttribute("evidence", ev);
        model.addAttribute("hashHistory", hashRepository.findByEvidenceIdOrderByVerificationTimestampDesc(id));
        model.addAttribute("verificationDto", new HashVerificationDto());
        return "evidence/details";
    }

    @GetMapping("/upload")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR', 'FORENSIC_ANALYST')")
    public String uploadForm(@RequestParam(required = false) Long caseId, Model model) {
        EvidenceUploadDto dto = new EvidenceUploadDto();
        dto.setCaseId(caseId);
        model.addAttribute("evidenceDto", dto);
        model.addAttribute("cases", caseRepository.findAll());
        return "evidence/upload";
    }

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR', 'FORENSIC_ANALYST')")
    public String handleUpload(@Valid @ModelAttribute("evidenceDto") EvidenceUploadDto dto,
                               BindingResult result,
                               @AuthenticationPrincipal UserDetails userDetails,
                               Model model,
                               RedirectAttributes redirectAttributes) {
        if (result.hasErrors()) {
            model.addAttribute("cases", caseRepository.findAll());
            return "evidence/upload";
        }
        User collector = userDetails != null ? userRepository.findByUsername(userDetails.getUsername()).orElse(null) : null;
        Evidence saved = evidenceService.registerEvidence(dto, collector);
        redirectAttributes.addFlashAttribute("successMessage", "Evidence item [" + saved.getEvidenceNumber() + "] ingested successfully.");
        return "redirect:/evidence/" + saved.getId();
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR', 'FORENSIC_ANALYST', 'EVIDENCE_CUSTODIAN')")
    public ResponseEntity<Resource> downloadEvidenceFile(@PathVariable Long id,
                                                         Authentication authentication,
                                                         HttpServletRequest request) {
        if (!securityService.canDownloadEvidence(authentication, id)) {
            throw new AccessDeniedException("Access Denied: You do not possess clearance to download evidence item #" + id);
        }

        Evidence evidence = evidenceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Evidence item not found with ID: " + id));

        if (evidence.getFileStoragePath() == null || evidence.getFileStoragePath().isBlank()) {
            throw new IllegalArgumentException("No raw file payload stored for this evidence item (Precomputed baseline).");
        }

        byte[] data = fileStorageService.loadStoredBytes(evidence.getFileStoragePath());
        ByteArrayResource resource = new ByteArrayResource(data);

        String username = authentication != null ? authentication.getName() : "system";
        String ipAddress = request.getRemoteAddr();

        // 1. Audit Log record
        auditService.log(null, username, "EVIDENCE_DOWNLOADED",
                String.format("Downloaded raw forensic bitstream for Evidence %s (%d bytes)", evidence.getEvidenceNumber(), data.length),
                ipAddress);

        // 2. Chain of Custody entry
        User actor = userRepository.findByUsername(username).orElse(null);
        CustodyTransferDto custodyDto = CustodyTransferDto.builder()
                .evidenceId(evidence.getId())
                .action(CustodyAction.DOWNLOADED_FOR_INSPECTION)
                .previousCustodian("Secure Forensics Vault")
                .newCustodian(actor != null ? actor.getFullName() : username)
                .location("Forensics Workstation [" + ipAddress + "]")
                .remarks("Cryptographic download for offline forensic analysis & trial preparation.")
                .build();
        custodyService.recordTransfer(custodyDto, actor);

        String safeDownloadName = evidence.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + safeDownloadName + "\"")
                .header("X-Content-Type-Options", "nosniff")
                .header(HttpHeaders.CACHE_CONTROL, "private, no-transform, no-store")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(data.length)
                .body(resource);
    }

    @PostMapping("/{id}/verify")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR', 'FORENSIC_ANALYST')")
    public String verifyIntegrity(@PathVariable Long id,
                                  @ModelAttribute HashVerificationDto dto,
                                  @AuthenticationPrincipal UserDetails userDetails,
                                  RedirectAttributes redirectAttributes) {
        User user = userDetails != null ? userRepository.findByUsername(userDetails.getUsername()).orElse(null) : null;
        evidenceHashService.verifyEvidenceIntegrity(id, dto.getFile(), dto.getManualCalculatedHash(), dto.getNotes(), user);
        redirectAttributes.addFlashAttribute("successMessage", "Cryptographic verification completed.");
        return "redirect:/evidence/" + id;
    }

    @PostMapping("/{id}/verify-stored")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR', 'FORENSIC_ANALYST')")
    public String verifyStoredIntegrity(@PathVariable Long id,
                                        @AuthenticationPrincipal UserDetails userDetails,
                                        RedirectAttributes redirectAttributes) {
        User user = userDetails != null ? userRepository.findByUsername(userDetails.getUsername()).orElse(null) : null;
        evidenceHashService.verifyPhysicalStoredEvidence(id, user);
        redirectAttributes.addFlashAttribute("successMessage", "Physical vault SHA-256 byte parity audit completed.");
        return "redirect:/evidence/" + id;
    }
}
