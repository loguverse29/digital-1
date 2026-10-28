package com.college.digitalforensics.dto;

import com.college.digitalforensics.entity.EvidenceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvidenceUploadDto {

    @NotNull(message = "Associated Case ID is required")
    private Long caseId;

    @NotBlank(message = "Evidence name is required")
    private String evidenceName;

    @NotNull(message = "Evidence type is required")
    private EvidenceType evidenceType;

    private String description;

    private String sourceDevice;

    @NotNull(message = "Collection timestamp is required")
    private LocalDateTime collectionTimestamp;

    @NotBlank(message = "Controlled storage identifier is required")
    private String controlledStorageIdentifier;

    // Optional physical or direct file upload
    private MultipartFile file;

    // Direct hash input if file was hashed at seizure scene
    private String precomputedSha256;
}
