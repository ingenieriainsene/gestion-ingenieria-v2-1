package com.ingenieria.controller;

import com.ingenieria.dto.CieRequestDTO;
import com.ingenieria.dto.LegalizacionRequestDTO;
import com.ingenieria.dto.LocalRequest;
import com.ingenieria.model.Local;
import com.ingenieria.service.CiePdfService;
import com.ingenieria.service.LegalizacionPdfService;
import com.ingenieria.service.LocalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/locales")

public class LocalController {
    @Autowired
    private LocalService service;

    @Autowired
    private LegalizacionPdfService legalizacionPdfService;

    @Autowired
    private CiePdfService ciePdfService;

    @GetMapping
    public List<Local> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Local> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody LocalRequest req) {
        try {
            return ResponseEntity.ok(service.createFromRequest(req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody LocalRequest req) {
        try {
            return ResponseEntity.ok(service.updateFromRequest(id, req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/check-rc/{rc}")
    public ResponseEntity<Local> getByRC(@PathVariable String rc) {
        Local l = service.findByReferenciaCatastral(rc);
        return l != null ? ResponseEntity.ok(l) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Genera la "Memoria Técnica de Instalación Fotovoltaica" para el local
     * indicado,
     * rellenando una plantilla PDF con los datos proporcionados.
     *
     * POST /api/locales/{id}/legalizacion/generar
     */
    @PostMapping("/{id}/legalizacion/generar")
    public ResponseEntity<byte[]> generarLegalizacion(
            @PathVariable Long id,
            @RequestBody LegalizacionRequestDTO dto) {
        // Por si se quiere validar que el local existe
        Local local = service.findById(id);
        if (local == null) {
            return ResponseEntity.notFound().build();
        }

        byte[] pdfBytes = legalizacionPdfService.generarLegalizacion(dto);

        String fileName = "memoria-legalizacion-local-" + id + ".pdf";
        String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20");

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFileName)
                .body(pdfBytes);
    }

    /**
     * Genera el "Certificado de Instalación Eléctrica" (CIE) para el local
     * indicado,
     * rellenando la plantilla PDF con los datos proporcionados.
     *
     * POST /api/locales/{id}/cie/generar
     */
    @PostMapping("/{id}/cie/generar")
    public ResponseEntity<byte[]> generarCie(
            @PathVariable Long id,
            @RequestBody CieRequestDTO dto) {
        Local local = service.findById(id);
        if (local == null) {
            return ResponseEntity.notFound().build();
        }

        byte[] pdfBytes = ciePdfService.generarCie(dto);

        String fileName = "certificado-instalacion-electrica-local-" + id + ".pdf";
        String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20");

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFileName)
                .body(pdfBytes);
    }
}
