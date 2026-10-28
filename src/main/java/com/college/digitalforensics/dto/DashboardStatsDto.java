package com.college.digitalforensics.dto;

import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDto {
    private long totalCases;
    private long openCases;
    private long inProgressCases;
    private long closedCases;

    private long totalEvidence;
    private long verifiedIntactEvidence;
    private long tamperedOrFlaggedEvidence;

    private long totalCustodyTransfers;
    private long totalActivities;

    private Map<String, Long> casesByCategory;
    private Map<String, Long> evidenceByType;
}
