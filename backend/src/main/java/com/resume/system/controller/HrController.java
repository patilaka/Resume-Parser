package com.resume.system.controller;

import com.resume.system.model.Candidate;
import com.resume.system.service.BlobStorageService;
import com.resume.system.service.HrService;
import com.resume.system.service.ResumeParserService;
import com.resume.system.repository.CandidateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api/hr")
@CrossOrigin(origins = "*")
public class HrController {

    @Autowired
    private BlobStorageService blobStorageService;

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private ResumeParserService resumeParserService;

    @Autowired
    private HrService hrService;

    // ─────────────────────────────────────────────────────────────────────
    // 1. BULK UPLOAD
    //    POST /api/hr/upload
    //    Accept: multipart/form-data with field name "files"
    // ─────────────────────────────────────────────────────────────────────
    @PostMapping("/upload")
    public ResponseEntity<List<Map<String, String>>> bulkUpload(
            @RequestParam("files") List<MultipartFile> files) {

        List<Map<String, String>> results = new ArrayList<>();

        for (MultipartFile file : files) {
            Map<String, String> entry = new HashMap<>();
            try {
                String trackingId = UUID.randomUUID().toString();

                // Save candidate record with PROCESSING status
                Candidate candidate = new Candidate();
                candidate.setId(trackingId);
                candidate.setTrackingId(trackingId);
                candidate.setStatus("PROCESSING");
                // Store original filename for HR reference
                candidate.setSummary("File: " + file.getOriginalFilename());
                candidateRepository.save(candidate);

                // Upload PDF to Azure Blob Storage
                blobStorageService.uploadResume(trackingId, file);

                // Trigger async parsing (PDFBox + Groq AI)
                resumeParserService.parseResume(trackingId);

                entry.put("trackingId", trackingId);
                entry.put("fileName", file.getOriginalFilename());
                entry.put("status", "PROCESSING");

            } catch (Exception e) {
                entry.put("fileName", file.getOriginalFilename());
                entry.put("status", "FAILED");
                entry.put("error", e.getMessage());
            }
            results.add(entry);
        }

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(results);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 2. GET ALL CANDIDATES
    //    GET /api/hr/candidates
    // ─────────────────────────────────────────────────────────────────────
    @GetMapping("/candidates")
    public ResponseEntity<List<Candidate>> getAllCandidates() {
        List<Candidate> candidates = new ArrayList<>();
        candidateRepository.findAll().forEach(candidates::add);
        return ResponseEntity.ok(candidates);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 3. RANK CANDIDATES
    //    GET /api/hr/rank
    //    → returns candidates sorted by roleMatchPercentage DESC
    // ─────────────────────────────────────────────────────────────────────
    @GetMapping("/rank")
    public ResponseEntity<List<Candidate>> getRankedCandidates() {
        List<Candidate> ranked = hrService.getRankedCandidates();
        return ResponseEntity.ok(ranked);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 4. FILTER CANDIDATES BY SKILL
    //    GET /api/hr/filter?skill=java
    // ─────────────────────────────────────────────────────────────────────
    @GetMapping("/filter")
    public ResponseEntity<List<Candidate>> filterBySkill(@RequestParam String skill) {
        List<Candidate> filtered = hrService.filterBySkill(skill);
        return ResponseEntity.ok(filtered);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 5. COMPARE CANDIDATES
    //    POST /api/hr/compare
    //    Body: { "ids": ["id1", "id2", ...] }
    // ─────────────────────────────────────────────────────────────────────
    @PostMapping("/compare")
    public ResponseEntity<Map<String, Object>> compareCandidates(
            @RequestBody Map<String, List<String>> request) {

        List<String> ids = request.get("ids");
        if (ids == null || ids.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "No candidate IDs provided"));
        }

        Map<String, Object> comparison = hrService.compareCandidates(ids);
        return ResponseEntity.ok(comparison);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 6. GET SINGLE CANDIDATE STATUS
    //    GET /api/hr/candidates/{trackingId}
    // ─────────────────────────────────────────────────────────────────────
    @GetMapping("/candidates/{trackingId}")
    public ResponseEntity<Candidate> getCandidate(@PathVariable String trackingId) {
        return candidateRepository.findByTrackingId(trackingId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
