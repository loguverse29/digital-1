package com.college.digitalforensics.repository;

import com.college.digitalforensics.entity.CaseStatus;
import com.college.digitalforensics.entity.InvestigationCase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InvestigationCaseRepository extends JpaRepository<InvestigationCase, Long> {

    Optional<InvestigationCase> findByCaseNumber(String caseNumber);

    boolean existsByCaseNumber(String caseNumber);

    Page<InvestigationCase> findByStatus(CaseStatus status, Pageable pageable);

    @Query("SELECT c FROM InvestigationCase c WHERE " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:category IS NULL OR c.category = :category) AND " +
           "(:keyword IS NULL OR LOWER(c.caseName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(c.caseNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(c.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<InvestigationCase> searchCases(@Param("status") CaseStatus status,
                                        @Param("category") String category,
                                        @Param("keyword") String keyword,
                                        Pageable pageable);

    long countByStatus(CaseStatus status);
}
