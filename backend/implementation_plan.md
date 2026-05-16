# Advanced Resume Storage, Tracking, & AI-Parsing System - Implementation Plan

## 1. System Architecture & Data Flow

The system is designed with an asynchronous, event-driven architecture to ensure scalability and responsiveness.

### End-to-End Flow
1.  **Frontend Upload:** The user uploads a resume (PDF) via the React frontend.
2.  **Backend Ingestion:** The React app sends a `POST` request to the Spring Boot REST API.
3.  **Storage & State Initialization:** 
    *   Spring Boot generates a unique `trackingId` (UUID) for the upload.
    *   It creates a new document in **Azure Cosmos DB** with the status `"PROCESSING"`.
    *   It uploads the PDF to **Azure Blob Storage** (under a specific container, e.g., `resumes`), attaching the `trackingId` as blob metadata.
    *   Spring Boot returns the `trackingId` to the frontend immediately (HTTP 202 Accepted).
4.  **Frontend Polling:** The React frontend begins polling a Spring Boot `/api/resumes/{trackingId}/status` endpoint (e.g., every 3-5 seconds).
5.  **Event-Driven Trigger:** The upload to Azure Blob Storage automatically triggers an asynchronous **Azure Function** via a BlobTrigger binding.
6.  **Text Extraction:** The Azure Function downloads the blob and uses **Apache PDFBox** to extract the raw text from the PDF.
7.  **AI Parsing:** The Azure Function sends the extracted text to the **Google Gemini API** (`gemini-1.5-flash`), enforcing a strict JSON response.
8.  **Database Update:** The Azure Function parses the JSON response from Gemini and updates the corresponding record in Azure Cosmos DB, setting the status to `"COMPLETED"` and populating the AI-extracted fields.
9.  **Frontend Resolution:** The next polling request from the React frontend sees the `"COMPLETED"` status, retrieves the full parsed data, and updates the UI.
10. **Smart Dashboard:** The React application updates the Kanban board, sorting applicants based on the newly acquired `job_match_score_out_of_100`.

---

## 2. AI Prompt Design (Gemini System Prompt)

To guarantee that Gemini returns *only* valid, parsable JSON without any Markdown wrapping (like \`\`\`json), we must use a highly constrained System Prompt and leverage the `response_mime_type` configuration if possible, or tightly control the output instructions.

**System Prompt Formulation:**

```text
You are an expert technical recruiter and resume parser AI. 
Your ONLY task is to analyze the provided resume text and extract specific data points into a strictly structured JSON response.

CRITICAL INSTRUCTIONS:
1. You MUST respond ONLY with a raw, valid JSON object. 
2. DO NOT include markdown formatting, code blocks (such as ```json), introductory text, or explanatory comments. 
3. The response must start with '{' and end with '}'.
4. The JSON keys MUST exactly match the schema below.

SCHEMA:
{
  "extracted_skills": ["List", "of", "strings", "representing", "technical", "and", "soft", "skills"],
  "total_years_experience": <integer representing total years of professional experience, estimate if necessary, default to 0>,
  "job_match_score_out_of_100": <integer from 0 to 100 representing how well the candidate matches a generic tech role, based on clarity, experience, and skills>
}

Resume Text:
{RESUME_TEXT_HERE}
```

---

## 3. Step-by-Step Execution Plan

### Phase 1: Infrastructure Setup (Azure & Google)
*   **Step 1.1:** Provision an Azure Resource Group.
*   **Step 1.2:** Create an Azure Storage Account (create a `resumes` blob container).
*   **Step 1.3:** Create an Azure Cosmos DB instance (SQL API) and set up a `Candidates` container partitioned by `trackingId` or `resumeId`.
*   **Step 1.4:** Set up an Azure Function App (Java 17).
*   **Step 1.5:** Obtain Google Gemini API Key.

### Phase 2: Spring Boot Backend Development
*   **Step 2.1:** Initialize Spring Boot 3 project with required dependencies (Web, Azure Storage Blob, Azure Cosmos, Lombok).
*   **Step 2.2:** Implement Azure Cosmos DB Repository `CandidateRepository`.
*   **Step 2.3:** Implement `BlobStorageService` for handling multi-part file uploads to Azure Blob Storage.
*   **Step 2.4:** Create REST Endpoints:
    *   `POST /api/resumes/upload` -> Handles file upload, DB initialization, and returns `trackingId`.
    *   `GET /api/resumes/{trackingId}/status` -> Returns the current processing status and details.
    *   `GET /api/resumes/` -> Returns all candidates sorted by match score for the dashboard.

### Phase 3: Azure Function Development (Event-Driven AI)
*   **Step 3.1:** Create a Java Azure Function with `@BlobTrigger(name = "content", path = "resumes/{name}", connection = "AzureWebJobsStorage")`.
*   **Step 3.2:** Integrate **Apache PDFBox** to read the incoming `byte[]` stream and convert it to a string.
*   **Step 3.3:** Implement a lightweight HTTP client (e.g., Java 11+ `HttpClient`) to call the Gemini API (`gemini-1.5-flash`).
*   **Step 3.4:** Inject the **System Prompt** designed above, append the parsed text, and handle the API request.
*   **Step 3.5:** Parse the returning JSON (e.g., using Jackson `ObjectMapper`).
*   **Step 3.6:** Connect to Azure Cosmos DB from the Function and update the document corresponding to the blob (retrieving the ID from blob metadata). Update status to `"COMPLETED"`.

### Phase 4: React & Tailwind Frontend Development
*   **Step 4.1:** Scaffold a Vite + React + Tailwind CSS project.
*   **Step 4.2:** Build the **Upload Module**: a drag-and-drop file upload component that POSTs to the Spring Boot backend.
*   **Step 4.3:** Implement **Frontend Polling**: After receiving the `trackingId`, use `setInterval` or a custom hook to poll the backend status API until it returns `"COMPLETED"`.
*   **Step 4.4:** Build the **Smart Dashboard**: A Kanban-style board.
*   **Step 4.5:** Implement dynamic sorting by `job_match_score_out_of_100`.
*   **Step 4.6:** Design the UI cards to neatly display the auto-extracted skills as Tailwind badges/tags.

### Phase 5: Integration & E2E Testing
*   **Step 5.1:** Perform End-to-End testing with sample resumes.
*   **Step 5.2:** Test edge cases (e.g., unreadable PDFs, Gemini returning garbled JSON).
*   **Step 5.3:** Refine prompt and polling intervals based on performance.
