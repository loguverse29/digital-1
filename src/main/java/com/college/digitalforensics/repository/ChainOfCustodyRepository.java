package com.college.digitalforensics.repository;

import com.college.digitalforensics.entity.ChainOfCustody;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChainOfCustodyRepository extends JpaRepository<ChainOfCustody, Long> {
    List<ChainOfCustody> findByEvidenceIdOrderByTimestampAsc(Long evidenceId);
    List<ChainOfCustody> findByInvestigationCaseIdOrderByTimestampDesc(Long caseId);
    Page<ChainOfCustody> findAllByOrderByTimestampDesc(Pageable pageable);
}
