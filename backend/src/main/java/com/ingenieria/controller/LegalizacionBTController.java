package com.ingenieria.controller;

import com.ingenieria.model.LegalizacionBT;
import com.ingenieria.service.LegalizacionBTService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/legalizaciones-bt")
@RequiredArgsConstructor
public class LegalizacionBTController {

    private final LegalizacionBTService service;

    @GetMapping("/local/{idLocal}")
    public List<LegalizacionBT> getByLocal(@PathVariable Long idLocal) {
        return service.findByLocal(idLocal);
    }

    @PostMapping("/local/{idLocal}")
    public ResponseEntity<LegalizacionBT> create(@PathVariable Long idLocal, @RequestBody LegalizacionBT legalizacion) {
        return ResponseEntity.ok(service.save(idLocal, legalizacion));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LegalizacionBT> getById(@PathVariable Long id) {
        LegalizacionBT leg = service.findById(id);
        return leg != null ? ResponseEntity.ok(leg) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/pdf/cie")
    public ResponseEntity<byte[]> downloadCie(@PathVariable Long id) {
        byte[] pdf = service.generarCiePdf(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"cie-legalizacion-" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/{id}/pdf/mtd")
    public ResponseEntity<byte[]> downloadMtd(
            @PathVariable Long id,
            @RequestParam(required = false) String tipoAutoconsumo,
            @RequestParam(required = false) String caracteristicas) {
        byte[] pdf = service.generarMtdPdf(id, tipoAutoconsumo, caracteristicas);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"mtd-legalizacion-" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/{id}/pdf/certificado")
    public ResponseEntity<byte[]> downloadCertificado(@PathVariable Long id) {
        byte[] pdf = service.generarCertificadoPdf(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"certificado-" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
