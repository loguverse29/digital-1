package com.college.digitalforensics.security;

import com.college.digitalforensics.entity.Role;
import com.college.digitalforensics.entity.User;
import com.college.digitalforensics.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class BruteForceThrottlingTest {

    @Autowired
    private LoginAttemptService loginAttemptService;

    @Autowired
    private UserRepository userRepository;

    private User targetUser;

    @BeforeEach
    public void setup() {
        userRepository.deleteAll();

        targetUser = User.builder()
                .username("suspect_officer")
                .fullName("Suspect Officer")
                .email("suspect@evidentx.gov")
                .passwordHash("$2a$12$SomeHashedPassword123456789")
                .role(Role.INVESTIGATOR)
                .activeStatus(true)
                .accountNonLocked(true)
                .failedLoginAttempts(0)
                .build();
        targetUser = userRepository.save(targetUser);
    }

    @Test
    @DisplayName("5 consecutive failed login attempts must lock account and trigger brute force throttling")
    public void testConsecutiveFailuresLockAccount() {
        String ip = "192.168.10.99";

        // Fail 4 times: account should still be unlocked
        for (int i = 1; i <= 4; i++) {
            loginAttemptService.loginFailed(targetUser.getUsername(), ip);
        }

        User checkUser = userRepository.findByUsername(targetUser.getUsername()).orElseThrow();
        assertEquals(4, checkUser.getFailedLoginAttempts());
        assertTrue(checkUser.getAccountNonLocked());
        assertFalse(loginAttemptService.isAccountBlocked(targetUser.getUsername()));

        // 5th failure: triggers account lock and IP throttling
        loginAttemptService.loginFailed(targetUser.getUsername(), ip);

        User lockedUser = userRepository.findByUsername(targetUser.getUsername()).orElseThrow();
        assertEquals(5, lockedUser.getFailedLoginAttempts());
        assertFalse(lockedUser.getAccountNonLocked());
        assertNotNull(lockedUser.getLockTime());
        assertTrue(loginAttemptService.isAccountBlocked(targetUser.getUsername()));
        assertTrue(loginAttemptService.isIpBlocked(ip));
    }

    @Test
    @DisplayName("Successful login resets failed attempts counter to 0")
    public void testSuccessfulLoginResetsCounter() {
        String ip = "192.168.10.88";

        // 3 failed attempts
        loginAttemptService.loginFailed(targetUser.getUsername(), ip);
        loginAttemptService.loginFailed(targetUser.getUsername(), ip);
        loginAttemptService.loginFailed(targetUser.getUsername(), ip);

        User beforeSuccess = userRepository.findByUsername(targetUser.getUsername()).orElseThrow();
        assertEquals(3, beforeSuccess.getFailedLoginAttempts());

        // Successful authentication
        loginAttemptService.loginSucceeded(targetUser.getUsername(), ip);

        User afterSuccess = userRepository.findByUsername(targetUser.getUsername()).orElseThrow();
        assertEquals(0, afterSuccess.getFailedLoginAttempts());
        assertTrue(afterSuccess.getAccountNonLocked());
    }
}
