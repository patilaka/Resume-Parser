package com.resume.system.service;

import com.resume.system.model.Candidate;
import com.resume.system.repository.CandidateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * HrService: Business logic for HR-specific operations.
 * - Ranking candidates by role match percentage
 * - Filtering by skill
 * - Side-by-side comparison of multiple candidates
 */
@Service
public class HrService {

    @Autowired
    private CandidateRepository candidateRepository;

    // ─────────────────────────────────────────────────────────────────────
    // Rank all COMPLETED candidates by roleMatchPercentage DESC
    // ─────────────────────────────────────────────────────────────────────
    public List<Candidate> getRankedCandidates() {
        List<Candidate> all = new ArrayList<>();
        candidateRepository.findAll().forEach(all::add);

        return all.stream()
                .filter(c -> "COMPLETED".equals(c.getStatus()))
                .sorted((a, b) -> {
                    int scoreA = a.getRoleMatchPercentage() != null ? a.getRoleMatchPercentage() : 0;
                    int scoreB = b.getRoleMatchPercentage() != null ? b.getRoleMatchPercentage() : 0;
                    return Integer.compare(scoreB, scoreA); // DESC
                })
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────
    // Filter by skill (case-insensitive match in technicalSkills)
    // ─────────────────────────────────────────────────────────────────────
    public List<Candidate> filterBySkill(String skill) {
        if (skill == null || skill.isBlank()) return Collections.emptyList();

        String lowerSkill = skill.toLowerCase().trim();
        List<Candidate> all = new ArrayList<>();
        candidateRepository.findAll().forEach(all::add);

        return all.stream()
                .filter(c -> "COMPLETED".equals(c.getStatus()))
                .filter(c -> {
                    List<String> skills = c.getTechnicalSkills();
                    if (skills == null) return false;
                    return skills.stream()
                            .anyMatch(s -> s.toLowerCase().contains(lowerSkill));
                })
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────
    // Compare multiple candidates side by side
    // Returns a structured map grouping their scores, skills, etc.
    // ─────────────────────────────────────────────────────────────────────
    public Map<String, Object> compareCandidates(List<String> ids) {
        List<Candidate> candidates = new ArrayList<>();

        for (String id : ids) {
            candidateRepository.findByTrackingId(id).ifPresent(candidates::add);
        }

        // Build comparison structure: each key maps to a list (one entry per candidate)
        Map<String, Object> comparison = new LinkedHashMap<>();

        List<Map<String, Object>> candidateProfiles = new ArrayList<>();
        for (Candidate c : candidates) {
            Map<String, Object> profile = new LinkedHashMap<>();
            profile.put("trackingId",          c.getTrackingId());
            profile.put("status",              c.getStatus());
            profile.put("atsScore",            c.getAtsScore());
            profile.put("atsCategory",         c.getAtsCategory());
            profile.put("roleMatchPercentage", c.getRoleMatchPercentage());
            profile.put("technicalSkills",     c.getTechnicalSkills());
            profile.put("softSkills",          c.getSoftSkills());
            profile.put("strengths",           c.getStrengths());
            profile.put("weaknesses",          c.getWeaknesses());
            profile.put("recommendedRoles",    c.getRecommendedRoles());
            profile.put("experience",          c.getExperience());
            profile.put("education",           c.getEducation());
            profile.put("improvements",        c.getImprovements());
            profile.put("missingSkills",       c.getMissingSkills());
            candidateProfiles.add(profile);
        }

        comparison.put("candidates", candidateProfiles);
        comparison.put("totalCompared", candidates.size());

        // Summary: who has the best score
        candidates.stream()
                .filter(c -> c.getRoleMatchPercentage() != null)
                .max(Comparator.comparingInt(Candidate::getRoleMatchPercentage))
                .ifPresent(best -> comparison.put("topCandidate", best.getTrackingId()));

        return comparison;
    }
}
