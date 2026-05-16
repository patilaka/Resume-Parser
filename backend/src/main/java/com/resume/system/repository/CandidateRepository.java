package com.resume.system.repository;

import com.resume.system.model.Candidate;
import com.azure.spring.data.cosmos.repository.CosmosRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CandidateRepository extends CosmosRepository<Candidate, String> {
    Optional<Candidate> findByTrackingId(String trackingId);
}
