package com.college.digitalforensics.controller;

import com.college.digitalforensics.service.AuditService;
import com.college.digitalforensics.service.EvidenceSecurityService;
import com.college.digitalforensics.service.PdfReportService;
import com.lowagie.text.DocumentException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportController {

    private final PdfReportService pdfReportService;
    private final EvidenceSecurityService securityService;
    private final AuditService auditService;

    @GetMapping("/cases/{caseId}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTIGATOR', 'LEAD_INVESTIGATOR')")
    public ResponseEntity<byte[]> downloadCasePdfReport(@PathVariable Long caseId,
                                                        Authentication authentication,
                                                        HttpServletRequest request) {
        if (!securityService.canAccessCase(authentication, caseId)) {
            throw new AccessDeniedException("Access Denied: You are not authorized to generate forensic reports for Case ID: " + caseId);
        }

        try {
            byte[] pdfBytes = pdfReportService.generateCaseForensicReport(caseId);

            String username = authentication != null ? authentication.getName() : "system";
            auditService.log(null, username, "REPORT_DOWNLOADED",
                    "Generated court-admissible forensic PDF dossier for Case ID: " + caseId, request.getRemoteAddr());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "Forensic_Dossier_Case_" + caseId + ".pdf");
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
            headers.set("X-Content-Type-Options", "nosniff");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);
        } catch (DocumentException e) {
            log.error("Failed to generate PDF forensic report for Case ID: " + caseId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
