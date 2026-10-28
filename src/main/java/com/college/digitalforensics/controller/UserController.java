package com.college.digitalforensics.controller;

import com.college.digitalforensics.dto.UserDto;
import com.college.digitalforensics.entity.Role;
import com.college.digitalforensics.entity.User;
import com.college.digitalforensics.repository.UserRepository;
import com.college.digitalforensics.security.LoginAttemptService;
import com.college.digitalforensics.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;

@Controller
@RequestMapping("/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final LoginAttemptService loginAttemptService;
    private final AuditService auditService;

    @GetMapping
    public String listUsers(Model model) {
        List<User> users = userRepository.findAll();
        model.addAttribute("users", users);
        model.addAttribute("newUser", new UserDto());
        model.addAttribute("roles", Role.values());
        return "admin/users";
    }

    @PostMapping("/create")
    public String createUser(@Valid @ModelAttribute("newUser") UserDto dto,
                             BindingResult result,
                             Authentication authentication,
                             HttpServletRequest request,
                             Model model,
                             RedirectAttributes redirectAttributes) {
        if (dto.getPassword() == null || dto.getPassword().length() < 8) {
            result.rejectValue("password", "error.password", "Password must be at least 8 characters");
        }
        if (userRepository.existsByUsername(dto.getUsername())) {
            result.rejectValue("username", "error.username", "Username already registered in enclave");
        }
        if (userRepository.existsByEmail(dto.getEmail())) {
            result.rejectValue("email", "error.email", "Email already in use");
        }

        if (result.hasErrors()) {
            model.addAttribute("users", userRepository.findAll());
            model.addAttribute("roles", Role.values());
            return "admin/users";
        }

        User user = User.builder()
                .username(dto.getUsername().trim())
                .fullName(dto.getFullName().trim())
                .email(dto.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(dto.getPassword()))
                .role(dto.getRole())
                .badgeNumber(dto.getBadgeNumber() != null ? dto.getBadgeNumber().trim() : null)
                .activeStatus(true)
                .accountNonLocked(true)
                .failedLoginAttempts(0)
                .build();

        userRepository.save(user);

        String adminUser = authentication.getName();
        String ipAddress = request.getRemoteAddr();
        auditService.log(user.getId(), adminUser, "USER_CREATED",
                String.format("Admin created account for [%s] with role [%s]", user.getUsername(), user.getRole()), ipAddress);

        redirectAttributes.addFlashAttribute("successMessage", "Account created successfully for officer " + user.getUsername());
        return "redirect:/admin/users";
    }

    @PostMapping("/{id}/role")
    public String updateRole(@PathVariable Long id,
                             @RequestParam Role role,
                             Authentication authentication,
                             HttpServletRequest request,
                             RedirectAttributes redirectAttributes) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + id));

        Role oldRole = user.getRole();
        user.setRole(role);
        userRepository.save(user);

        String adminUser = authentication.getName();
        String ipAddress = request.getRemoteAddr();
        auditService.log(user.getId(), adminUser, "USER_ROLE_CHANGED",
                String.format("Admin %s updated role of %s from %s to %s", adminUser, user.getUsername(), oldRole, role), ipAddress);

        redirectAttributes.addFlashAttribute("successMessage", "Role updated to " + role + " for " + user.getUsername());
        return "redirect:/admin/users";
    }

    @PostMapping("/{id}/status")
    public String toggleStatus(@PathVariable Long id,
                               Authentication authentication,
                               HttpServletRequest request,
                               RedirectAttributes redirectAttributes) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + id));

        // Prevent self-deactivation by the active admin
        if (user.getUsername().equalsIgnoreCase(authentication.getName())) {
            redirectAttributes.addFlashAttribute("errorMessage", "Security constraint: You cannot deactivate your own administrative account.");
            return "redirect:/admin/users";
        }

        boolean newStatus = !Boolean.TRUE.equals(user.getActiveStatus());
        user.setActiveStatus(newStatus);
        userRepository.save(user);

        String adminUser = authentication.getName();
        String ipAddress = request.getRemoteAddr();
        String action = newStatus ? "USER_ACTIVATED" : "USER_DEACTIVATED";
        auditService.log(user.getId(), adminUser, action,
                String.format("Admin %s toggled active status to %s for %s", adminUser, newStatus, user.getUsername()), ipAddress);

        redirectAttributes.addFlashAttribute("successMessage", "User " + user.getUsername() + " status updated to " + (newStatus ? "Active" : "Deactivated"));
        return "redirect:/admin/users";
    }

    @PostMapping("/{id}/unlock")
    public String unlockUser(@PathVariable Long id,
                             Authentication authentication,
                             HttpServletRequest request,
                             RedirectAttributes redirectAttributes) {
        loginAttemptService.unlockAccount(id, authentication.getName(), request.getRemoteAddr());
        redirectAttributes.addFlashAttribute("successMessage", "Account successfully unlocked and failed attempts reset.");
        return "redirect:/admin/users";
    }
}
