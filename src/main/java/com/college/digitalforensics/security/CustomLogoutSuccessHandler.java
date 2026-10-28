package com.college.digitalforensics.security;

import com.college.digitalforensics.service.AuditService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.SimpleUrlLogoutSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class CustomLogoutSuccessHandler extends SimpleUrlLogoutSuccessHandler {

    private final AuditService auditService;

    @Override
    public void onLogoutSuccess(HttpServletRequest request,
                                HttpServletResponse response,
                                Authentication authentication) throws IOException, ServletException {
        if (authentication != null) {
            String username = authentication.getName();
            String ipAddress = request.getRemoteAddr();
            log.info("User [{}] logged out securely from IP [{}]", username, ipAddress);
            auditService.log(null, username, "AUTH_LOGOUT", "User voluntarily terminated session.", ipAddress);
        }

        setDefaultTargetUrl("/login?logout=true");
        super.onLogoutSuccess(request, response, authentication);
    }
}
