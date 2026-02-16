package com.ingenieria.repository;

import com.ingenieria.model.CrmDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CrmDocumentRepository extends JpaRepository<CrmDocument, UUID> {
    List<CrmDocument> findByEntityTypeAndReferenceId(String entityType, Long referenceId);
}
