package com.resume.system.controller;

import com.resume.system.model.Candidate;
import com.resume.system.repository.CandidateRepository;
import com.resume.system.service.BlobStorageService;
import com.resume.system.service.ResumeParserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/resumes")
@CrossOrigin(origins = "*")
public class ResumeController {

    @Autowired
    private BlobStorageService blobStorageService;

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private ResumeParserService resumeParserService;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadResume(@RequestParam("file") MultipartFile file) {
        try {
            String trackingId = UUID.randomUUID().toString();
            
            // 1. Create DB Record with PROCESSING status
            Candidate candidate = new Candidate();
            candidate.setId(trackingId);
            candidate.setTrackingId(trackingId);
            candidate.setStatus("PROCESSING");
            candidateRepository.save(candidate);

            // 2. Upload to Blob Storage
            blobStorageService.uploadResume(trackingId, file);

            // 3. Kick off async PDF parsing + Gemini AI (runs in background thread)
            resumeParserService.parseResume(trackingId);

            Map<String, String> response = new HashMap<>();
            response.put("trackingId", trackingId);
            response.put("status", "PROCESSING");

            return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{trackingId}/status")
    public ResponseEntity<Candidate> getStatus(@PathVariable String trackingId) {
        return candidateRepository.findByTrackingId(trackingId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/")
    public ResponseEntity<List<Candidate>> getAllCandidates() {
        List<Candidate> candidates = new ArrayList<>();
        candidateRepository.findAll().forEach(candidates::add);
        return ResponseEntity.ok(candidates);
    }
}
