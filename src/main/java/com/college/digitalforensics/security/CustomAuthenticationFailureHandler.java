package com.college.digitalforensics.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class CustomAuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    private final LoginAttemptService loginAttemptService;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception) throws IOException, ServletException {
        String username = request.getParameter("username");
        String ipAddress = getClientIP(request);

        log.warn("Authentication failure for username: [{}] from IP: [{}] - Reason: {}",
                username, ipAddress, exception.getMessage());

        loginAttemptService.loginFailed(username, ipAddress);

        String targetUrl;
        if (exception instanceof LockedException || loginAttemptService.isAccountBlocked(username)) {
            targetUrl = "/login?locked=true";
        } else if (exception instanceof DisabledException) {
            targetUrl = "/login?disabled=true";
        } else {
            targetUrl = "/login?error=true";
        }

        setDefaultFailureUrl(targetUrl);
        super.onAuthenticationFailure(request, response, exception);
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || !xfHeader.contains(",")) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
