package com.resume.function;

import com.microsoft.azure.functions.annotation.*;
import com.microsoft.azure.functions.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.azure.cosmos.*;
import com.azure.cosmos.models.*;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import java.util.HashMap;

public class ResumeParserFunction {

    private static final String GEMINI_API_KEY = System.getenv("GEMINI_API_KEY");
    private static final String COSMOS_ENDPOINT = System.getenv("COSMOS_ENDPOINT");
    private static final String COSMOS_KEY = System.getenv("COSMOS_KEY");

    private CosmosClient cosmosClient;

    public ResumeParserFunction() {
        if (COSMOS_ENDPOINT != null && COSMOS_KEY != null) {
            cosmosClient = new CosmosClientBuilder()
                    .endpoint(COSMOS_ENDPOINT)
                    .key(COSMOS_KEY)
                    .buildClient();
        }
    }

    @FunctionName("ParseResumeBlobTrigger")
    public void run(
        @BlobTrigger(
            name = "content",
            path = "resumes/{name}",
            dataType = "binary",
            connection = "AzureWebJobsStorage"
        ) byte[] content,
        @BindingName("name") String name,
        @BindingName("Metadata.trackingId") String trackingId,
        final ExecutionContext context
    ) {
        context.getLogger().info("Java Blob trigger retrieved blob: " + name);
        String extractedText = "";

        if (trackingId == null) {
            // Fallback to name without .pdf
            trackingId = name.replace(".pdf", "");
        }

        try (InputStream is = new ByteArrayInputStream(content);
             PDDocument document = PDDocument.load(is)) {
            PDFTextStripper stripper = new PDFTextStripper();
            extractedText = stripper.getText(document);
        } catch (Exception e) {
            context.getLogger().severe("Error parsing PDF: " + e.getMessage());
            updateCosmosStatus(trackingId, "FAILED_PDF_PARSE", null, context);
            return;
        }

        try {
            String jsonResult = callGeminiApi(extractedText, context);
            updateCosmosStatus(trackingId, "COMPLETED", jsonResult, context);
        } catch (Exception e) {
            context.getLogger().severe("Error calling Gemini API or updating Cosmos: " + e.getMessage());
            updateCosmosStatus(trackingId, "FAILED_AI_PARSE", null, context);
        }
    }

    private String callGeminiApi(String resumeText, ExecutionContext context) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY;
        
        String systemInstruction = "You are an expert technical recruiter and resume parser AI. " +
            "Your ONLY task is to analyze the provided resume text and extract specific data points into a strictly structured JSON response. " +
            "CRITICAL INSTRUCTIONS: 1. You MUST respond ONLY with a raw, valid JSON object. " +
            "2. DO NOT include markdown formatting, code blocks (such as ```json), introductory text, or explanatory comments. " +
            "3. The response must start with '{' and end with '}'. " +
            "4. The JSON keys MUST exactly match the schema below. " +
            "SCHEMA: {\"extracted_skills\": [\"list\"], \"total_years_experience\": 0, \"job_match_score_out_of_100\": 0}";

        ObjectMapper mapper = new ObjectMapper();
        
        // Prepare prompt payload
        Map<String, Object> payload = new HashMap<>();
        
        Map<String, Object> systemInstructionMap = new HashMap<>();
        Map<String, Object> systemParts = new HashMap<>();
        systemParts.put("text", systemInstruction);
        systemInstructionMap.put("parts", new Object[]{systemParts});
        payload.put("system_instruction", systemInstructionMap);

        Map<String, Object> contentsMap = new HashMap<>();
        Map<String, Object> contentParts = new HashMap<>();
        contentParts.put("text", "Resume Text:\n" + resumeText);
        contentsMap.put("parts", new Object[]{contentParts});
        payload.put("contents", new Object[]{contentsMap});

        String requestBody = mapper.writeValueAsString(payload);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        
        if (response.statusCode() != 200) {
            throw new RuntimeException("Gemini API returned " + response.statusCode() + " " + response.body());
        }

        JsonNode root = mapper.readTree(response.body());
        String botReply = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
        
        // Sometimes Gemini wraps in ```json ... ```, strip it
        botReply = botReply.replaceAll("(?s)```json(.*?)```", "$1").trim();
        botReply = botReply.replaceAll("(?s)```(.*?)```", "$1").trim();

        return botReply;
    }

    private void updateCosmosStatus(String trackingId, String status, String jsonResult, ExecutionContext context) {
        if (cosmosClient == null) return;
        
        CosmosContainer container = cosmosClient.getDatabase("ResumeDb").getContainer("Candidates");
        
        // Read item
        CosmosItemResponse<Map> response = container.readItem(trackingId, new PartitionKey(trackingId), Map.class);
        Map<String, Object> item = response.getItem();
        
        item.put("status", status);
        
        if (jsonResult != null) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode parsedData = mapper.readTree(jsonResult);
                
                if (parsedData.has("extracted_skills")) {
                    item.put("extractedSkills", mapper.convertValue(parsedData.get("extracted_skills"), java.util.List.class));
                }
                if (parsedData.has("total_years_experience")) {
                    item.put("totalYearsExperience", parsedData.get("total_years_experience").asInt());
                }
                if (parsedData.has("job_match_score_out_of_100")) {
                    item.put("jobMatchScore", parsedData.get("job_match_score_out_of_100").asInt());
                }
            } catch (Exception e) {
                context.getLogger().warning("Failed to parse Gemini JSON output: " + e.getMessage());
            }
        }
        
        container.replaceItem(item, trackingId, new PartitionKey(trackingId), new CosmosItemRequestOptions());
        context.getLogger().info("Successfully updated Cosmos DB for " + trackingId);
    }
}
