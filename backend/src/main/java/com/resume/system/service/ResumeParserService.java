package com.resume.system.service;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resume.system.model.Candidate;
import com.resume.system.repository.CandidateRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ResumeParserService {

    @Autowired
    private BlobServiceClient blobServiceClient;

    @Autowired
    private CandidateRepository candidateRepository;

    @Value("${app.azure.storage.container-name:resumes-raw}")
    private String containerName;

    @Value("${app.groq.api-key}")
    private String groqApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String SYSTEM_PROMPT =
        "You are an advanced ATS system and career advisor.\n\n" +
        "Analyze the resume and return a COMPLETE professional evaluation.\n\n" +
        "Be strict, realistic, and avoid generic answers.\n\n" +
        "IMPORTANT:\n" +
        "- Return ONLY valid JSON\n" +
        "- No extra text outside JSON\n" +
        "- Keep responses clear and structured for UI display\n\n" +
        "Return JSON in EXACT format (no extra fields, no markdown):\n" +
        "{\n" +
        "  \"ats_score\": 0,\n" +
        "  \"ats_category\": \"\",\n" +
        "  \"summary\": \"\",\n" +
        "  \"technical_skills\": [],\n" +
        "  \"soft_skills\": [],\n" +
        "  \"experience\": \"\",\n" +
        "  \"education\": \"\",\n" +
        "  \"projects\": [],\n" +
        "  \"strengths\": [],\n" +
        "  \"weaknesses\": [],\n" +
        "  \"improvements\": [],\n" +
        "  \"recommended_roles\": [],\n" +
        "  \"role_match_percentage\": 0,\n" +
        "  \"missing_skills\": [],\n" +
        "  \"learning_suggestions\": [],\n" +
        "  \"ats_keywords\": []\n" +
        "}\n\n" +
        "Tasks:\n" +
        "1. ats_score (0-100) + ats_category: Excellent/Good/Average/Poor\n" +
        "2. summary: 3-5 line professional evaluation\n" +
        "3. technical_skills and soft_skills separately\n" +
        "4. experience: short structured summary\n" +
        "5. education: extract clearly\n" +
        "6. projects: key projects with short description\n" +
        "7. strengths: bullet points of what is done well\n" +
        "8. weaknesses: real issues only, no generic statements\n" +
        "9. improvements: actionable suggestions with rewritten examples\n" +
        "10. recommended_roles: best fitting roles + role_match_percentage for top role\n" +
        "11. missing_skills + learning_suggestions for top roles\n" +
        "12. ats_keywords: important keywords missing from the resume";

    @Async
    public void parseResume(String trackingId) {
        try {
            BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
            BlobClient blobClient = containerClient.getBlobClient(trackingId + ".pdf");

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            blobClient.downloadStream(baos);

            String extractedText;
            try (InputStream is = new java.io.ByteArrayInputStream(baos.toByteArray());
                 PDDocument document = PDDocument.load(is)) {
                extractedText = new PDFTextStripper().getText(document);
            }

            String jsonResult = callGroqApi(extractedText);
            updateCandidate(trackingId, "COMPLETED", jsonResult);

        } catch (Exception e) {
            System.err.println("[ResumeParser] Error: " + trackingId + " - " + e.getMessage());
            updateCandidate(trackingId, "FAILED", null);
        }
    }

    private String callGroqApi(String resumeText) throws Exception {
        Map<String, String> systemMsg = new HashMap<>();
        systemMsg.put("role", "system");
        systemMsg.put("content", SYSTEM_PROMPT);

        Map<String, String> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", "Resume Text:\n" + resumeText);

        Map<String, Object> payload = new HashMap<>();
        payload.put("model", "llama-3.3-70b-versatile");
        payload.put("messages", new Object[]{systemMsg, userMsg});
        payload.put("temperature", 0.1);

        HttpResponse<String> response = HttpClient.newHttpClient().send(
            HttpRequest.newBuilder()
                .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + groqApiKey)
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                .build(),
            HttpResponse.BodyHandlers.ofString()
        );

        if (response.statusCode() != 200)
            throw new RuntimeException("Groq API " + response.statusCode() + ": " + response.body());

        String reply = objectMapper.readTree(response.body())
            .path("choices").get(0).path("message").path("content").asText();

        reply = reply.replaceAll("(?s)```json(.*?)```", "$1").trim();
        reply = reply.replaceAll("(?s)```(.*?)```", "$1").trim();
        return reply;
    }

    private void updateCandidate(String trackingId, String status, String jsonResult) {
        try {
            Optional<Candidate> optional = candidateRepository.findByTrackingId(trackingId);
            if (optional.isEmpty()) return;

            Candidate c = optional.get();
            c.setStatus(status);

            if (jsonResult != null) {
                JsonNode p = objectMapper.readTree(jsonResult);

                if (p.has("ats_score"))             c.setAtsScore(p.get("ats_score").asInt());
                if (p.has("ats_category"))          c.setAtsCategory(p.get("ats_category").asText());
                if (p.has("summary"))               c.setSummary(p.get("summary").asText());
                if (p.has("technical_skills"))      c.setTechnicalSkills(toList(p.get("technical_skills")));
                if (p.has("soft_skills"))           c.setSoftSkills(toList(p.get("soft_skills")));
                if (p.has("experience"))            c.setExperience(p.get("experience").asText());
                if (p.has("education"))             c.setEducation(p.get("education").asText());
                if (p.has("projects"))              c.setProjects(toList(p.get("projects")));
                if (p.has("strengths"))             c.setStrengths(toList(p.get("strengths")));
                if (p.has("weaknesses"))            c.setWeaknesses(toList(p.get("weaknesses")));
                if (p.has("improvements"))          c.setImprovements(toList(p.get("improvements")));
                if (p.has("recommended_roles"))     c.setRecommendedRoles(toList(p.get("recommended_roles")));
                if (p.has("role_match_percentage")) c.setRoleMatchPercentage(p.get("role_match_percentage").asInt());
                if (p.has("missing_skills"))        c.setMissingSkills(toList(p.get("missing_skills")));
                if (p.has("learning_suggestions"))  c.setLearningSuggestions(toList(p.get("learning_suggestions")));
                if (p.has("ats_keywords"))          c.setAtsKeywords(toList(p.get("ats_keywords")));

                c.setExtractedSkills(c.getTechnicalSkills());
                c.setJobMatchScore(c.getRoleMatchPercentage());
            }

            candidateRepository.save(c);
            System.out.println("[ResumeParser] Done: " + trackingId + " | Score: " + c.getAtsScore() + " (" + c.getAtsCategory() + ")");
        } catch (Exception e) {
            System.err.println("[ResumeParser] Save failed for " + trackingId + ": " + e.getMessage());
        }
    }

    private List<String> toList(JsonNode node) {
        List<String> list = new ArrayList<>();
        if (node != null && node.isArray())
            node.forEach(n -> list.add(n.asText()));
        return list;
    }
}
