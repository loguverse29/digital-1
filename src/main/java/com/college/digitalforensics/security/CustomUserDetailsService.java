package com.college.digitalforensics.security;

import com.college.digitalforensics.entity.User;
import com.college.digitalforensics.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        // Account active check
        if (Boolean.FALSE.equals(user.getActiveStatus())) {
            log.warn("Access attempt on deactivated account: {}", username);
            throw new DisabledException("Account is deactivated. Contact an administrator.");
        }

        // Lock check with auto-recovery after timeout (15 mins)
        boolean isLocked = false;
        if (Boolean.FALSE.equals(user.getAccountNonLocked())) {
            if (user.getLockTime() != null && user.getLockTime().plusMinutes(15).isBefore(LocalDateTime.now())) {
                // Auto-recover lock after timeout
                user.setAccountNonLocked(true);
                user.setFailedLoginAttempts(0);
                user.setLockTime(null);
                userRepository.save(user);
                log.info("Temporary lockout expired for user {}. Account restored.", username);
            } else {
                isLocked = true;
                log.warn("Access attempt on locked account: {}", username);
                throw new LockedException("Account is temporarily locked due to multiple failed login attempts. Please try again after 15 minutes or contact your security administrator.");
            }
        }

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPasswordHash(),
                user.getActiveStatus(),
                true, // accountNonExpired
                true, // credentialsNonExpired
                !isLocked, // accountNonLocked
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }
}
