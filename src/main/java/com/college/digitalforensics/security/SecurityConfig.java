package com.college.digitalforensics.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final CustomAuthenticationFailureHandler failureHandler;
    private final CustomAuthenticationSuccessHandler successHandler;
    private final CustomLogoutSuccessHandler logoutSuccessHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 1. CSRF Protection
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .ignoringRequestMatchers("/h2-console/**")
            )

            // 2. HTTP Security Headers
            .headers(headers -> headers
                .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin) // allows H2 console and nested previews safely
                .contentTypeOptions(contentType -> {}) // nosniff
                .xssProtection(xss -> {})
            )

            // 3. Endpoint Authorization & Role-Based Access Control
            .authorizeHttpRequests(auth -> auth
                // Public resources
                .requestMatchers("/css/**", "/js/**", "/images/**", "/webjars/**", "/login", "/error", "/h2-console/**").permitAll()

                // Admin-only management endpoints
                .requestMatchers("/admin/**", "/users/**").hasRole("ADMIN")

                // Case management endpoints
                .requestMatchers("/cases/new", "/cases/*/edit").hasAnyRole("ADMIN", "INVESTIGATOR", "LEAD_INVESTIGATOR")
                .requestMatchers("/cases/**").hasAnyRole("ADMIN", "INVESTIGATOR", "LEAD_INVESTIGATOR", "FORENSIC_ANALYST", "EVIDENCE_CUSTODIAN")

                // Evidence ingestion and verification
                .requestMatchers("/evidence/upload", "/evidence/*/verify", "/evidence/*/verify-stored")
                    .hasAnyRole("ADMIN", "INVESTIGATOR", "LEAD_INVESTIGATOR", "FORENSIC_ANALYST")
                .requestMatchers("/evidence/*/download")
                    .hasAnyRole("ADMIN", "INVESTIGATOR", "LEAD_INVESTIGATOR", "FORENSIC_ANALYST", "EVIDENCE_CUSTODIAN")
                .requestMatchers("/evidence/**")
                    .hasAnyRole("ADMIN", "INVESTIGATOR", "LEAD_INVESTIGATOR", "FORENSIC_ANALYST", "EVIDENCE_CUSTODIAN")

                // Chain of Custody
                .requestMatchers("/custody/transfer")
                    .hasAnyRole("ADMIN", "INVESTIGATOR", "LEAD_INVESTIGATOR", "EVIDENCE_CUSTODIAN")
                .requestMatchers("/custody/**")
                    .hasAnyRole("ADMIN", "INVESTIGATOR", "LEAD_INVESTIGATOR", "FORENSIC_ANALYST", "EVIDENCE_CUSTODIAN")

                // Forensic reporting
                .requestMatchers("/reports/**")
                    .hasAnyRole("ADMIN", "INVESTIGATOR", "LEAD_INVESTIGATOR")

                // REST API endpoints require authentication
                .requestMatchers("/api/**").authenticated()

                // Default rule: Any other request requires authentication
                .anyRequest().authenticated()
            )

            // 4. Form Login with Throttling & Account Lock Protection Handlers
            .formLogin(form -> form
                .loginPage("/login")
                .successHandler(successHandler)
                .failureHandler(failureHandler)
                .permitAll()
            )

            // 5. Logout Management
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessHandler(logoutSuccessHandler)
                .invalidateHttpSession(true)
                .clearAuthentication(true)
                .deleteCookies("JSESSIONID", "EVIDENTX_SESSIONID", "XSRF-TOKEN")
                .permitAll()
            )

            // 6. Secure Session Management & Session Fixation Protection
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .sessionFixation().migrateSession()
                .maximumSessions(2)
                .maxSessionsPreventsLogin(false)
                .expiredUrl("/login?expired=true")
            );

        return http.build();
    }
}
