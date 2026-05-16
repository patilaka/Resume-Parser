package com.resume.system.service;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Map;
import java.util.HashMap;

@Service
public class BlobStorageService {
    @Autowired
    private BlobServiceClient blobServiceClient;

    @Value("${app.azure.storage.container-name:resumes-raw}")
    private String containerName;

    public void uploadResume(String trackingId, MultipartFile file) throws IOException {
        BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
        if (!containerClient.exists()) {
            containerClient.create();
        }
        BlobClient blobClient = containerClient.getBlobClient(trackingId + ".pdf");
        
        Map<String, String> metadata = new HashMap<>();
        metadata.put("trackingId", trackingId);

        blobClient.upload(file.getInputStream(), file.getSize(), true);
        blobClient.setMetadata(metadata);
    }
}
