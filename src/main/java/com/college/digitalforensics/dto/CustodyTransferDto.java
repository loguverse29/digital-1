package com.college.digitalforensics.dto;

import com.college.digitalforensics.entity.CustodyAction;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustodyTransferDto {

    @NotNull(message = "Evidence ID is mandatory")
    private Long evidenceId;

    @NotNull(message = "Action type is mandatory")
    private CustodyAction action;

    @NotBlank(message = "Current/previous custodian is mandatory")
    private String previousCustodian;

    @NotBlank(message = "New custodian receiving evidence is mandatory")
    private String newCustodian;

    private String location;

    private String remarks;

    private String custodySignatureToken;
}
