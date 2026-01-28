package com.ingenieria.controller;
// Holaaaaa
import com.ingenieria.model.ArchivoCliente;
import com.ingenieria.model.ArchivoTramite;
import com.ingenieria.service.ArchivoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.nio.file.Path;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/archivos")
public class ArchivoController {

    @Autowired
    private ArchivoService archivoService;

    // --- Archivos Cliente ---

    @PostMapping("/cliente/{idCliente}")
    public ResponseEntity<?> subirArchivoCliente(@PathVariable Long idCliente,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "categoria", required = false) String categoria) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String usuario = auth.getName();

            ArchivoCliente archivo = archivoService.subirArchivoCliente(idCliente, file, usuario, categoria);
            return ResponseEntity.ok(archivo);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al subir archivo: " + e.getMessage());
        }
    }

    @GetMapping("/cliente/{idCliente}")
    public ResponseEntity<List<ArchivoCliente>> listarArchivosCliente(@PathVariable Long idCliente) {
        return ResponseEntity.ok(archivoService.listarArchivosCliente(idCliente));
    }

    // --- Archivos Trámite ---

    @PostMapping("/tramite/{idTramite}")
    public ResponseEntity<?> subirArchivoTramite(@PathVariable Long idTramite,
            @RequestParam("file") MultipartFile file) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String usuario = auth.getName();

            ArchivoTramite archivo = archivoService.subirArchivoTramite(idTramite, file, usuario);
            return ResponseEntity.ok(archivo);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al subir archivo: " + e.getMessage());
        }
    }

    @GetMapping("/tramite/{idTramite}")
    public ResponseEntity<List<ArchivoTramite>> listarArchivosTramite(@PathVariable Long idTramite) {
        return ResponseEntity.ok(archivoService.listarArchivosTramite(idTramite));
    }

    // --- Descarga de Archivos ---

    @GetMapping("/download/{filename:.+}")
    public ResponseEntity<Resource> descargarArchivo(@PathVariable String filename) {
        try {
            Path filePath = archivoService.cargarArchivo(filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_OCTET_STREAM)
                        .header(HttpHeaders.CONTENT_DISPOSITION,
                                "attachment; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
