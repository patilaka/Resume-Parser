package com.resume.system.model;

import com.azure.spring.data.cosmos.core.mapping.Container;
import com.azure.spring.data.cosmos.core.mapping.PartitionKey;
import org.springframework.data.annotation.Id;
import lombok.Data;
import java.util.List;

@Data
@Container(containerName = "Candidates")
public class Candidate {
    @Id
    private String id;
    @PartitionKey
    private String trackingId;
    private String status;

    // ATS Score
    private Integer atsScore;
    private String atsCategory;

    // Summary
    private String summary;

    // Skills
    private List<String> technicalSkills;
    private List<String> softSkills;

    // Key Info
    private String experience;
    private String education;
    private List<String> projects;

    // Analysis
    private List<String> strengths;
    private List<String> weaknesses;
    private List<String> improvements;

    // Job Matching
    private List<String> recommendedRoles;
    private Integer roleMatchPercentage;

    // Skill Gap
    private List<String> missingSkills;
    private List<String> learningSuggestions;

    // ATS Keywords
    private List<String> atsKeywords;

    // Legacy fields
    private List<String> extractedSkills;
    private Integer jobMatchScore;
}
