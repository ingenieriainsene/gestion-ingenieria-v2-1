package com.ingenieria.service;

import com.ingenieria.config.StorageProperties;
import com.ingenieria.dto.ArchivoAdjuntoDTO;
import com.ingenieria.model.ArchivoAdjunto;
import com.ingenieria.repository.ArchivoAdjuntoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LocalFileStorageService {

    private final StorageProperties storageProperties;
    private final ArchivoAdjuntoRepository archivoAdjuntoRepository;
    private Path basePath;

    @PostConstruct
    public void init() {
        basePath = Paths.get(storageProperties.getLocation()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(basePath);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo crear el directorio de almacenamiento: " + basePath, e);
        }
    }

    public ArchivoAdjuntoDTO guardarArchivo(String entidadTipo, Long entidadId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Archivo vacío o inválido.");
        }
        if (entidadTipo == null || entidadTipo.isBlank() || entidadId == null) {
            throw new IllegalArgumentException("entidadTipo y entidadId son obligatorios.");
        }

        String original = sanitizeOriginalFilename(file.getOriginalFilename());
        String extension = getExtension(original);
        String nombreDisco = UUID.randomUUID().toString() + extension;

        Path destino = basePath.resolve(nombreDisco).normalize();
        if (!destino.startsWith(basePath)) {
            throw new IllegalArgumentException("Nombre de archivo no permitido.");
        }

        try {
            Files.copy(file.getInputStream(), destino, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Error guardando el archivo en disco.", e);
        }

        ArchivoAdjunto adj = new ArchivoAdjunto();
        adj.setEntidadTipo(entidadTipo.trim().toUpperCase());
        adj.setEntidadId(entidadId);
        adj.setNombreOriginal(original);
        adj.setNombreDisco(nombreDisco);
        adj.setTipoMime(file.getContentType());
        adj.setTamanoBytes(file.getSize());
        adj.setFechaCreacion(OffsetDateTime.now());

        ArchivoAdjunto saved = archivoAdjuntoRepository.save(adj);
        return toDto(saved);
    }

    public List<ArchivoAdjuntoDTO> listarArchivos(String entidadTipo, Long entidadId) {
        return archivoAdjuntoRepository
                .findByEntidadTipoAndEntidadIdOrderByFechaCreacionDesc(entidadTipo.trim().toUpperCase(), entidadId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public Resource cargarComoResource(UUID idArchivo) {
        ArchivoAdjunto meta = archivoAdjuntoRepository.findById(idArchivo)
                .orElseThrow(() -> new IllegalArgumentException("Archivo no encontrado."));
        Path filePath = basePath.resolve(meta.getNombreDisco()).normalize();
        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new IllegalArgumentException("Archivo no accesible.");
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error cargando el archivo.", e);
        }
    }

    public ArchivoAdjuntoDTO findMeta(UUID idArchivo) {
        ArchivoAdjunto meta = archivoAdjuntoRepository.findById(idArchivo)
                .orElseThrow(() -> new IllegalArgumentException("Archivo no encontrado."));
        return toDto(meta);
    }

    public void borrarArchivo(UUID idArchivo) {
        ArchivoAdjunto meta = archivoAdjuntoRepository.findById(idArchivo)
                .orElseThrow(() -> new IllegalArgumentException("Archivo no encontrado."));
        Path filePath = basePath.resolve(meta.getNombreDisco()).normalize();
        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo borrar el archivo físico.", e);
        }
        archivoAdjuntoRepository.deleteById(idArchivo);
    }

    private String sanitizeOriginalFilename(String filename) {
        String cleaned = StringUtils.cleanPath(filename != null ? filename : "archivo");
        String onlyName = Paths.get(cleaned).getFileName().toString();
        if (onlyName.contains("..")) {
            throw new IllegalArgumentException("Nombre de archivo no permitido.");
        }
        return onlyName.replaceAll("[\\\\/]", "_");
    }

    private String getExtension(String filename) {
        int idx = filename.lastIndexOf('.');
        if (idx <= 0 || idx >= filename.length() - 1) {
            return "";
        }
        return filename.substring(idx);
    }

    private ArchivoAdjuntoDTO toDto(ArchivoAdjunto a) {
        return new ArchivoAdjuntoDTO(
                a.getIdArchivo(),
                a.getEntidadTipo(),
                a.getEntidadId(),
                a.getNombreOriginal(),
                a.getNombreDisco(),
                a.getTipoMime(),
                a.getTamanoBytes(),
                a.getFechaCreacion());
    }
}
