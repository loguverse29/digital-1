package com.college.digitalforensics.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "investigation_cases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvestigationCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "case_number", nullable = false, unique = true, length = 50)
    private String caseNumber;

    @NotBlank
    @Size(max = 200)
    @Column(name = "case_name", nullable = false, length = 200)
    private String caseName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotBlank
    @Column(nullable = false, length = 50)
    private String category;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String priority = "HIGH";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_investigator_id")
    private User assignedInvestigator;

    @Column(name = "assigned_investigator_name", length = 100)
    private String assignedInvestigatorName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private CaseStatus status = CaseStatus.OPEN;

    @Column(name = "incident_date")
    private LocalDateTime incidentDate;

    @Column(name = "court_jurisdiction", length = 100)
    private String courtJurisdiction;

    @OneToMany(mappedBy = "investigationCase", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Evidence> evidences = new ArrayList<>();

    @OneToMany(mappedBy = "investigationCase", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InvestigationActivity> activities = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
