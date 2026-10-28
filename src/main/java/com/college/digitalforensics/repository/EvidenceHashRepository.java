package com.college.digitalforensics.repository;

import com.college.digitalforensics.entity.EvidenceHash;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvidenceHashRepository extends JpaRepository<EvidenceHash, Long> {
    List<EvidenceHash> findByEvidenceIdOrderByVerificationTimestampDesc(Long evidenceId);
}
