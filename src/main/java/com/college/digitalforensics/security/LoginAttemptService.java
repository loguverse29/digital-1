package com.college.digitalforensics.security;

import com.college.digitalforensics.entity.User;
import com.college.digitalforensics.repository.UserRepository;
import com.college.digitalforensics.service.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoginAttemptService {

    public static final int MAX_ATTEMPTS = 5;
    public static final int LOCKOUT_MINUTES = 15;

    private final UserRepository userRepository;
    private final AuditService auditService;

    // In-memory sliding cache for IP-based throttling
    private final Map<String, Integer> ipAttemptsCache = new ConcurrentHashMap<>();
    private final Map<String, Long> ipLockoutTimestamps = new ConcurrentHashMap<>();

    public boolean isIpBlocked(String ipAddress) {
        if (ipAddress == null) return false;
        Long lockoutTime = ipLockoutTimestamps.get(ipAddress);
        if (lockoutTime != null) {
            long elapsedMinutes = (System.currentTimeMillis() - lockoutTime) / (60 * 1000);
            if (elapsedMinutes < LOCKOUT_MINUTES) {
                return true;
            } else {
                // Lock expired
                ipLockoutTimestamps.remove(ipAddress);
                ipAttemptsCache.remove(ipAddress);
            }
        }
        return ipAttemptsCache.getOrDefault(ipAddress, 0) >= MAX_ATTEMPTS;
    }

    public boolean isAccountBlocked(String username) {
        if (username == null || username.isBlank()) return false;
        Optional<User> userOpt = userRepository.findByUsername(username.trim());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (Boolean.FALSE.equals(user.getAccountNonLocked())) {
                if (user.getLockTime() != null && user.getLockTime().plusMinutes(LOCKOUT_MINUTES).isBefore(LocalDateTime.now())) {
                    // Lockout period expired; eligible for automatic unlock
                    return false;
                }
                return true;
            }
        }
        return false;
    }

    @Transactional
    public void loginFailed(String username, String ipAddress) {
        // Track IP-level failures
        if (ipAddress != null) {
            int ipAttempts = ipAttemptsCache.getOrDefault(ipAddress, 0) + 1;
            ipAttemptsCache.put(ipAddress, ipAttempts);
            if (ipAttempts >= MAX_ATTEMPTS) {
                ipLockoutTimestamps.put(ipAddress, System.currentTimeMillis());
                log.warn("SECURITY ALERT: IP [{}] temporarily blocked after {} failed attempts.", ipAddress, ipAttempts);
                auditService.log(null, "ANONYMOUS", "IP_TEMPORARILY_BLOCKED",
                        String.format("IP %s exceeded %d failed login attempts.", ipAddress, MAX_ATTEMPTS), ipAddress);
            }
        }

        // Track user-level failures
        if (username != null && !username.isBlank()) {
            Optional<User> userOpt = userRepository.findByUsername(username.trim());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                int attempts = (user.getFailedLoginAttempts() != null ? user.getFailedLoginAttempts() : 0) + 1;
                user.setFailedLoginAttempts(attempts);

                if (attempts >= MAX_ATTEMPTS) {
                    user.setAccountNonLocked(false);
                    user.setLockTime(LocalDateTime.now());
                    log.warn("SECURITY ALERT: Account [{}] locked after {} consecutive failed login attempts.", username, attempts);
                    auditService.log(user.getId(), username, "AUTH_ACCOUNT_LOCKED",
                            String.format("Account locked for %d minutes after %d failed attempts.", LOCKOUT_MINUTES, attempts), ipAddress);
                } else {
                    auditService.log(user.getId(), username, "AUTH_LOGIN_FAILED",
                            String.format("Failed login attempt (%d/%d).", attempts, MAX_ATTEMPTS), ipAddress);
                }
                userRepository.save(user);
            } else {
                auditService.log(null, username, "AUTH_LOGIN_FAILED", "Failed login for non-existent username.", ipAddress);
            }
        }
    }

    @Transactional
    public void loginSucceeded(String username, String ipAddress) {
        if (ipAddress != null) {
            ipAttemptsCache.remove(ipAddress);
            ipLockoutTimestamps.remove(ipAddress);
        }

        if (username != null && !username.isBlank()) {
            Optional<User> userOpt = userRepository.findByUsername(username.trim());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setFailedLoginAttempts(0);
                user.setAccountNonLocked(true);
                user.setLockTime(null);
                userRepository.save(user);

                auditService.log(user.getId(), username, "AUTH_LOGIN_SUCCESS", "Authenticated successfully into security enclave.", ipAddress);
            }
        }
    }

    @Transactional
    public void unlockAccount(Long userId, String adminUsername, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        user.setFailedLoginAttempts(0);
        user.setAccountNonLocked(true);
        user.setLockTime(null);
        userRepository.save(user);

        ipAttemptsCache.clear();

        log.info("Administrator [{}] unlocked account for user [{}]", adminUsername, user.getUsername());
        auditService.log(user.getId(), adminUsername, "USER_UNLOCKED",
                String.format("Admin %s unlocked account for %s (%s)", adminUsername, user.getUsername(), user.getFullName()), ipAddress);
    }
}
