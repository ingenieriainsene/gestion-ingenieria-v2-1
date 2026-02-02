package com.ingenieria.controller;

import com.ingenieria.dto.PresupuestoDTO;
import com.ingenieria.dto.PresupuestoListResponse;
import com.ingenieria.service.PdfService;
import com.ingenieria.service.PresupuestoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/presupuestos")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class PresupuestoController {

    private final PresupuestoService service;
    private final PdfService pdfService;

    @GetMapping
    public List<PresupuestoListResponse> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.findById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<?> downloadPdf(@PathVariable Long id) {
        try {
            byte[] pdf = pdfService.generarPresupuestoPdf(id);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"presupuesto_" + id + ".pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("No se pudo generar el PDF.");
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody PresupuestoDTO dto) {
        try {
            return ResponseEntity.ok(service.crearPresupuesto(dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody PresupuestoDTO dto) {
        try {
            return ResponseEntity.ok(service.actualizarPresupuesto(id, dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
