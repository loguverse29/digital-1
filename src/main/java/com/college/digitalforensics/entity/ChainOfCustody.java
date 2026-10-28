package com.college.digitalforensics.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "chain_of_custody")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChainOfCustody {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evidence_id", nullable = false)
    private Evidence evidence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private InvestigationCase investigationCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;

    @NotBlank
    @Column(name = "actor_name", nullable = false, length = 100)
    private String actorName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private CustodyAction action;

    @NotBlank
    @Column(name = "previous_custodian", nullable = false, length = 100)
    private String previousCustodian;

    @NotBlank
    @Column(name = "new_custodian", nullable = false, length = 100)
    private String newCustodian;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @Column(length = 150)
    private String location;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "custody_signature_token", length = 100)
    private String custodySignatureToken;
}
