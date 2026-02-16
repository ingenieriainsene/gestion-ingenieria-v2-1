package com.ingenieria.service;

import com.ingenieria.model.CrmDocument;
import com.ingenieria.repository.CrmDocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@Service
public class CrmFileStorageService {

    @Value("${app.file.upload-dir}")
    private String uploadDir;

    @Autowired
    private CrmDocumentRepository crmDocumentRepository;

    private Path fileStorageLocation;

    @PostConstruct
    public void init() {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("No se pudo crear el directorio de subida de archivos.", ex);
        }
    }

    @Transactional
    public List<CrmDocument> storeFiles(List<MultipartFile> files, Long referenceId, String entityType) {
        return files.stream()
                .map(file -> storeFile(file, referenceId, entityType))
                .toList();
    }

    public String getStorageLocation() {
        return this.fileStorageLocation.toAbsolutePath().toString();
    }

    @Transactional
    public CrmDocument storeFile(MultipartFile file, Long referenceId, String entityType) {
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());

        if (originalFileName.contains("..")) {
            throw new RuntimeException("Nombre de archivo invalido: " + originalFileName);
        }

        String fileExtension = "";
        int i = originalFileName.lastIndexOf('.');
        if (i > 0) {
            fileExtension = originalFileName.substring(i);
        }

        // Generate safe unique system name
        String systemFileName = UUID.randomUUID().toString() + fileExtension;

        try {
            // Check if file is empty
            if (file.isEmpty()) {
                throw new RuntimeException("No se puede subir un archivo vacio.");
            }

            // Determine subfolder based on entityType (e.g., "clientes", "contratos")
            String folderName = normalizeEntityFolder(entityType);

            // Create target directory: uploads/{folderName}/{referenceId}
            Path entityPath = this.fileStorageLocation.resolve(folderName).resolve(String.valueOf(referenceId));
            Files.createDirectories(entityPath);

            // Save file
            Path targetLocation = entityPath.resolve(systemFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // Save metadata
            CrmDocument document = new CrmDocument();
            document.setReferenceId(referenceId);
            document.setEntityType(entityType);
            document.setFileNameOriginal(originalFileName);
            document.setFileNameSystem(systemFileName);

            // Store RELATIVE path for portability (e.g., "clientes/1/uuid.pdf")
            // We use forward slashes for consistency across OS
            String relativePath = folderName + "/" + referenceId + "/" + systemFileName;
            document.setFilePath(relativePath);

            document.setFileType(file.getContentType());
            document.setSize(file.getSize());

            return crmDocumentRepository.save(document);
        } catch (IOException ex) {
            throw new RuntimeException("No se pudo guardar el archivo " + originalFileName, ex);
        }
    }

    public Resource loadFileAsResource(UUID documentId) {
        CrmDocument doc = crmDocumentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Documento no encontrado con ID: " + documentId));

        try {
            Path filePath;
            // Handle both legacy absolute paths and new relative paths
            Path storedPath = Paths.get(doc.getFilePath());

            if (storedPath.isAbsolute()) {
                // Legacy: Absolute path stored in DB
                filePath = storedPath;
            } else {
                // New: Relative path stored in DB, resolve against uploadDir
                filePath = this.fileStorageLocation.resolve(doc.getFilePath()).normalize();
            }

            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("No se puede leer el archivo: " + doc.getFileNameOriginal());
            }
        } catch (Exception ex) {
            throw new RuntimeException("No se puede leer el archivo: " + doc.getFileNameOriginal(), ex);
        }
    }

    public CrmDocument getDocumentMetadata(UUID documentId) {
        return crmDocumentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Documento no encontrado con ID: " + documentId));
    }

    public List<CrmDocument> getDocumentsByEntity(String entityType, Long referenceId) {
        return crmDocumentRepository.findByEntityTypeAndReferenceId(entityType, referenceId);
    }

    public void deleteFile(UUID documentId) {
        CrmDocument doc = crmDocumentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Documento no encontrado con ID: " + documentId));

        try {
            // 1. Delete physical file
            Path filePath;
            Path storedPath = Paths.get(doc.getFilePath());

            if (storedPath.isAbsolute()) {
                filePath = storedPath;
            } else {
                filePath = this.fileStorageLocation.resolve(doc.getFilePath()).normalize();
            }

            Files.deleteIfExists(filePath);

            // 2. Delete DB record
            crmDocumentRepository.delete(doc);

        } catch (IOException ex) {
            throw new RuntimeException("No se pudo eliminar el archivo físico: " + doc.getFileNameOriginal(), ex);
        }
    }

    private String normalizeEntityFolder(String entityType) {
        if (entityType == null)
            return "otros";
        String lower = entityType.toLowerCase().trim();
        return switch (lower) {
            case "cliente" -> "clientes";
            case "contrato" -> "contratos";
            case "tramite" -> "tramites";
            case "usuario" -> "usuarios";
            default -> lower + "s"; // Generic pluralization
        };
    }
}
