package com.college.digitalforensics.repository;

import com.college.digitalforensics.entity.Evidence;
import com.college.digitalforensics.entity.EvidenceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EvidenceRepository extends JpaRepository<Evidence, Long> {

    Optional<Evidence> findByEvidenceNumber(String evidenceNumber);

    Optional<Evidence> findByOriginalSha256Hash(String hash);

    List<Evidence> findByInvestigationCaseId(Long caseId);

    Page<Evidence> findByInvestigationCaseId(Long caseId, Pageable pageable);

    @Query("SELECT e FROM Evidence e WHERE " +
           "(:caseId IS NULL OR e.investigationCase.id = :caseId) AND " +
           "(:evidenceType IS NULL OR e.evidenceType = :evidenceType) AND " +
           "(:verifiedStatus IS NULL OR e.verifiedStatus = :verifiedStatus) AND " +
           "(:keyword IS NULL OR LOWER(e.evidenceName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(e.evidenceNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(e.controlledStorageIdentifier) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Evidence> searchEvidence(@Param("caseId") Long caseId,
                                  @Param("evidenceType") EvidenceType evidenceType,
                                  @Param("verifiedStatus") String verifiedStatus,
                                  @Param("keyword") String keyword,
                                  Pageable pageable);

    long countByVerifiedStatus(String status);
}
