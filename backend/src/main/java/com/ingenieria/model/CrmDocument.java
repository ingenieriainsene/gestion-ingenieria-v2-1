package com.ingenieria.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.UuidGenerator;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "crm_documents")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmDocument {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "reference_id", nullable = false)
    private Long referenceId;

    @Column(name = "entity_type", nullable = false)
    private String entityType;

    @Column(name = "file_name_original", nullable = false)
    private String fileNameOriginal;

    @Column(name = "file_name_system", nullable = false)
    private String fileNameSystem;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "file_type")
    private String fileType;

    @Column(name = "size")
    private Long size;

    @Column(name = "uploaded_at", insertable = false, updatable = false)
    private LocalDateTime uploadedAt;

    @PrePersist
    protected void onCreate() {
        if (uploadedAt == null)
            uploadedAt = LocalDateTime.now();
    }
}
