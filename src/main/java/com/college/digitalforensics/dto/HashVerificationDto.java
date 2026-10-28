package com.college.digitalforensics.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HashVerificationDto {

    @NotNull(message = "Evidence ID is required")
    private Long evidenceId;

    // Direct re-uploaded file to verify bit-by-bit
    private MultipartFile file;

    // Or manual recalculated hash input
    private String manualCalculatedHash;

    private String notes;
}
