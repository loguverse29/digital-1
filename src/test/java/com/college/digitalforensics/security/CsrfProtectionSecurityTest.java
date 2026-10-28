package com.college.digitalforensics.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class CsrfProtectionSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("POST /admin/users/create without CSRF token must fail with 403 Forbidden")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testPostWithoutCsrf_FailsForbidden() throws Exception {
        mockMvc.perform(post("/admin/users/create")
                        .param("username", "testofficer")
                        .param("fullName", "Test Officer")
                        .param("email", "test@forensics.gov")
                        .param("password", "Secret1234!")
                        .param("role", "INVESTIGATOR"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /cases/new without CSRF token must fail with 403 Forbidden")
    @WithMockUser(username = "investigator1", roles = {"INVESTIGATOR"})
    public void testPostCaseWithoutCsrf_FailsForbidden() throws Exception {
        mockMvc.perform(post("/cases/new")
                        .param("caseName", "Unauthorized Case")
                        .param("category", "RANSOMWARE")
                        .param("priority", "HIGH"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST with valid CSRF token is accepted past CSRF filter")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testPostWithValidCsrf_Accepted() throws Exception {
        mockMvc.perform(post("/admin/users/create")
                        .with(csrf())
                        .param("username", "officer_ok")
                        .param("fullName", "Valid Officer")
                        .param("email", "valid@forensics.gov")
                        .param("password", "ComplexP@ssw0rd")
                        .param("role", "INVESTIGATOR"))
                .andExpect(status().is3xxRedirection()); // Redirects to /admin/users on success
    }
}
