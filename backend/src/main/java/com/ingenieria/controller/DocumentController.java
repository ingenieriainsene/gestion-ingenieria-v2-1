package com.ingenieria.controller;

import com.ingenieria.model.CrmDocument;
import com.ingenieria.service.CrmFileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    @Autowired
    private CrmFileStorageService fileStorageService;

    @PostMapping("/upload")
    public ResponseEntity<List<CrmDocument>> uploadFile(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam("referenceId") Long referenceId,
            @RequestParam("entityType") String entityType) {

        List<CrmDocument> docs = fileStorageService.storeFiles(files, referenceId, entityType);
        return ResponseEntity.ok(docs);
    }

    @GetMapping("/location")
    public ResponseEntity<String> getStorageLocation() {
        return ResponseEntity.ok(fileStorageService.getStorageLocation());
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadFile(@PathVariable UUID id) {
        Resource resource = fileStorageService.loadFileAsResource(id);
        CrmDocument doc = fileStorageService.getDocumentMetadata(id);

        return ResponseEntity.ok()
                .contentType(MediaType
                        .parseMediaType(doc.getFileType() != null ? doc.getFileType() : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getFileNameOriginal() + "\"")
                .body(resource);
    }

    @GetMapping("/list/{entityType}/{referenceId}")
    public ResponseEntity<List<CrmDocument>> listDocuments(
            @PathVariable String entityType,
            @PathVariable Long referenceId) {
        return ResponseEntity.ok(fileStorageService.getDocumentsByEntity(entityType, referenceId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable UUID id) {
        fileStorageService.deleteFile(id);
        return ResponseEntity.noContent().build();
    }
}
