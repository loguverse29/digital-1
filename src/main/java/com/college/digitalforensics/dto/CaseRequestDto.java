package com.college.digitalforensics.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseRequestDto {

    @NotBlank(message = "Case name is mandatory")
    @Size(max = 200, message = "Case name cannot exceed 200 characters")
    private String caseName;

    private String description;

    @NotBlank(message = "Category is mandatory")
    private String category;

    @NotBlank(message = "Priority is mandatory")
    private String priority;

    private Long assignedInvestigatorId;

    private LocalDateTime incidentDate;

    private String courtJurisdiction;
}
