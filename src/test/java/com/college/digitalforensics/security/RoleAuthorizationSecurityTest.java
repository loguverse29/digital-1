package com.college.digitalforensics.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class RoleAuthorizationSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("INVESTIGATOR role attempting to access /admin/users must receive 403 Forbidden")
    @WithMockUser(username = "investigator1", roles = {"INVESTIGATOR"})
    public void testInvestigatorCannotAccessAdminUsers() throws Exception {
        mockMvc.perform(get("/admin/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ADMIN role accessing /admin/users receives 200 OK")
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testAdminCanAccessAdminUsers() throws Exception {
        mockMvc.perform(get("/admin/users"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("INVESTIGATOR role accessing /cases receives 200 OK")
    @WithMockUser(username = "investigator1", roles = {"INVESTIGATOR"})
    public void testInvestigatorCanAccessCases() throws Exception {
        mockMvc.perform(get("/cases"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("INVESTIGATOR role accessing /cases/new receives 200 OK")
    @WithMockUser(username = "investigator1", roles = {"INVESTIGATOR"})
    public void testInvestigatorCanAccessNewCaseForm() throws Exception {
        mockMvc.perform(get("/cases/new"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("INVESTIGATOR role accessing /evidence receives 200 OK")
    @WithMockUser(username = "investigator1", roles = {"INVESTIGATOR"})
    public void testInvestigatorCanAccessEvidence() throws Exception {
        mockMvc.perform(get("/evidence"))
                .andExpect(status().isOk());
    }
}
