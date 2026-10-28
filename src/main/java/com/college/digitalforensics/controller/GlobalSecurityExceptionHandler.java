package com.college.digitalforensics.controller;

import com.college.digitalforensics.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@ControllerAdvice
@RequiredArgsConstructor
@Slf4j
public class GlobalSecurityExceptionHandler {

    private final AuditService auditService;

    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public String handleAccessDeniedException(AccessDeniedException ex, HttpServletRequest request, Model model) {
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : "anonymous";
        String uri = request.getRequestURI();
        log.warn("SECURITY ALERT: Access denied for principal [{}] on resource [{}] - Reason: {}",
                username, uri, ex.getMessage());

        auditService.log(null, username, "ACCESS_DENIED_VIOLATION",
                String.format("Unauthorized attempt to access protected resource: %s", uri), request.getRemoteAddr());

        model.addAttribute("errorCode", 403);
        model.addAttribute("errorTitle", "Security Clearance Denied");
        model.addAttribute("errorMessage", "Your security role does not have authorization to access this forensic asset or docket.");
        return "error/403";
    }

    @ExceptionHandler(SecurityException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public String handleSecurityViolation(SecurityException ex, HttpServletRequest request, Model model) {
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : "anonymous";
        log.error("SECURITY ALERT: Security rule breach detected from [{}]: {}", username, ex.getMessage());

        auditService.log(null, username, "SECURITY_RULE_BREACH", ex.getMessage(), request.getRemoteAddr());

        model.addAttribute("errorCode", 400);
        model.addAttribute("errorTitle", "Security Policy Violation");
        model.addAttribute("errorMessage", ex.getMessage());
        return "error/error";
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public String handleIllegalArgumentException(IllegalArgumentException ex, Model model) {
        log.warn("Invalid client input: {}", ex.getMessage());
        model.addAttribute("errorCode", 400);
        model.addAttribute("errorTitle", "Invalid Request Parameters");
        model.addAttribute("errorMessage", ex.getMessage());
        return "error/error";
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    @ResponseStatus(HttpStatus.PAYLOAD_TOO_LARGE)
    public String handleMaxSizeException(MaxUploadSizeExceededException ex, Model model) {
        log.warn("Upload size limit exceeded: {}", ex.getMessage());
        model.addAttribute("errorCode", 413);
        model.addAttribute("errorTitle", "Evidence Payload Too Large");
        model.addAttribute("errorMessage", "The evidence payload exceeds maximum allowed single upload threshold (500 MB).");
        return "error/error";
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public String handleGenericException(Exception ex, HttpServletRequest request, Model model) {
        // Log full internal stack trace safely to server logs ONLY, never to client response
        log.error("Unhandled internal application exception processing request: {}", request.getRequestURI(), ex);

        model.addAttribute("errorCode", 500);
        model.addAttribute("errorTitle", "Internal System Exception");
        model.addAttribute("errorMessage", "An unexpected system error occurred while processing your request. Incident logged in security ledger.");
        return "error/error";
    }
}
