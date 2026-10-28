package com.college.digitalforensics.repository;

import com.college.digitalforensics.entity.InvestigationActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvestigationActivityRepository extends JpaRepository<InvestigationActivity, Long> {
    List<InvestigationActivity> findByInvestigationCaseIdOrderByTimestampDesc(Long caseId);
    Page<InvestigationActivity> findAllByOrderByTimestampDesc(Pageable pageable);
}
