package com.ingenieria.controller;

import com.ingenieria.service.DocumentoPdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/documentos")
@RequiredArgsConstructor
public class DocumentoController {

    private final DocumentoPdfService documentoPdfService;

    @GetMapping("/albaran/{presupuestoId}")
    public ResponseEntity<?> descargarAlbaran(@PathVariable Long presupuestoId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String usuarioBd = auth != null ? auth.getName() : "sistema";
        try {
            byte[] pdf = documentoPdfService.generarAlbaranPdf(presupuestoId, usuarioBd);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"albaran_" + presupuestoId + ".pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("No se pudo generar el PDF.");
        }
    }

    @GetMapping("/factura/{presupuestoId}")
    public ResponseEntity<?> descargarFactura(@PathVariable Long presupuestoId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String usuarioBd = auth != null ? auth.getName() : "sistema";
        try {
            byte[] pdf = documentoPdfService.generarFacturaPdf(presupuestoId, usuarioBd);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"factura_" + presupuestoId + ".pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("No se pudo generar el PDF.");
        }
    }
}
