package com.ingenieria.controller;

import com.ingenieria.model.Cliente;
import com.ingenieria.service.ClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {
    @Autowired
    private ClienteService service;

    @GetMapping
    public List<Cliente> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cliente> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/search")
    public List<Cliente> search(@RequestParam("q") String term) {
        return service.search(term);
    }

    @PostMapping
    public ResponseEntity<Cliente> create(@RequestBody Cliente cliente) {
        return ResponseEntity.ok(service.save(cliente));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Cliente> update(@PathVariable Long id, @RequestBody Cliente cliente) {
        cliente.setIdCliente(id);
        return ResponseEntity.ok(service.save(cliente));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    // --- ARCHIVOS ---

    @GetMapping("/{id}/archivos")
    public List<com.ingenieria.dto.ArchivoClienteDTO> getArchivos(@PathVariable Long id) {
        return service.getArchivos(id);
    }

    @PostMapping("/{id}/archivos")
    public ResponseEntity<?> uploadArchivo(@PathVariable Long id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            String username = "sistema"; // TODO: SecurityContext
            try {
                org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                        .getContext().getAuthentication();
                if (auth != null)
                    username = auth.getName();
            } catch (Exception ig) {
            }

            return ResponseEntity.ok(service.subirArchivo(id, file, username));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al subir archivo: " + e.getMessage());
        }
    }

    @GetMapping("/archivos/{fileId}/download")
    public ResponseEntity<org.springframework.core.io.Resource> downloadArchivo(@PathVariable Long fileId) {
        try {
            com.ingenieria.model.ArchivoCliente archivo = service.getArchivoEntity(fileId);
            java.nio.file.Path path = java.nio.file.Paths.get("uploads")
                    .resolve("clientes")
                    .resolve(String.valueOf(archivo.getCliente().getIdCliente()))
                    .resolve(archivo.getNombreFisico());

            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(path.toUri());

            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                                "attachment; filename=\"" + archivo.getNombreVisible() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/archivos/{fileId}")
    public ResponseEntity<Void> deleteArchivo(@PathVariable Long fileId) {
        service.deleteArchivo(fileId);
        return ResponseEntity.noContent().build();
    }
}
