package com.college.digitalforensics.service;

import com.college.digitalforensics.entity.Evidence;
import com.college.digitalforensics.entity.InvestigationActivity;
import com.college.digitalforensics.entity.InvestigationCase;
import com.college.digitalforensics.entity.User;
import com.college.digitalforensics.repository.InvestigationActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InvestigationActivityService {

    private final InvestigationActivityRepository activityRepository;

    @Transactional
    public InvestigationActivity logActivity(InvestigationCase investigationCase, Evidence evidence, User actor,
                                            String activityType, String description) {
        String actorName = actor != null ? actor.getFullName() : "Forensics System";
        InvestigationActivity activity = InvestigationActivity.builder()
                .investigationCase(investigationCase)
                .evidence(evidence)
                .actor(actor)
                .actorName(actorName)
                .activityType(activityType)
                .activityDescription(description)
                .timestamp(LocalDateTime.now())
                .build();
        return activityRepository.save(activity);
    }

    public List<InvestigationActivity> getActivitiesForCase(Long caseId) {
        return activityRepository.findByInvestigationCaseIdOrderByTimestampDesc(caseId);
    }
}
