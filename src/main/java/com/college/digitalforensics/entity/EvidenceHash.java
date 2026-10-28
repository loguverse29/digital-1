package com.college.digitalforensics.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "evidence_hashes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvidenceHash {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evidence_id", nullable = false)
    private Evidence evidence;

    @NotBlank
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String algorithm = "SHA-256";

    @NotBlank
    @Size(min = 64, max = 64)
    @Column(name = "original_hash", nullable = false, length = 64)
    private String originalHash;

    @NotBlank
    @Size(min = 64, max = 64)
    @Column(name = "calculated_hash", nullable = false, length = 64)
    private String calculatedHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_outcome", nullable = false, length = 30)
    private VerificationOutcome verificationOutcome;

    @CreationTimestamp
    @Column(name = "verification_timestamp", updatable = false)
    private LocalDateTime verificationTimestamp;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verifying_user_id")
    private User verifyingUser;

    @NotBlank
    @Column(name = "verifying_user_name", nullable = false, length = 100)
    private String verifyingUserName;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
