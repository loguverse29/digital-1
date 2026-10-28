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
@Table(name = "evidence")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Evidence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "evidence_number", nullable = false, unique = true, length = 50)
    private String evidenceNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private InvestigationCase investigationCase;

    @NotBlank
    @Size(max = 200)
    @Column(name = "evidence_name", nullable = false, length = 200)
    private String evidenceName;

    @Enumerated(EnumType.STRING)
    @Column(name = "evidence_type", nullable = false, length = 50)
    private EvidenceType evidenceType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "source_device", length = 150)
    private String sourceDevice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collector_id")
    private User collector;

    @NotBlank
    @Column(name = "collector_name", nullable = false, length = 100)
    private String collectorName;

    @Column(name = "collection_timestamp", nullable = false)
    private LocalDateTime collectionTimestamp;

    @NotBlank
    @Size(min = 64, max = 64)
    @Column(name = "original_sha256_hash", nullable = false, length = 64)
    private String originalSha256Hash;

    @NotBlank
    @Column(name = "controlled_storage_identifier", nullable = false, length = 100)
    private String controlledStorageIdentifier;

    @NotBlank
    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    @Column(name = "file_size_bytes", nullable = false)
    @Builder.Default
    private Long fileSizeBytes = 0L;

    @Column(name = "file_mime_type", length = 100)
    private String fileMimeType;

    @Column(name = "file_storage_path", length = 500)
    private String fileStoragePath;

    @Column(name = "verified_status", nullable = false, length = 30)
    @Builder.Default
    private String verifiedStatus = "PENDING";

    @Column(name = "last_verification_timestamp")
    private LocalDateTime lastVerificationTimestamp;

    @OneToMany(mappedBy = "evidence", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EvidenceHash> hashHistory = new ArrayList<>();

    @OneToMany(mappedBy = "evidence", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ChainOfCustody> custodyChain = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
