package com.ingenieria.controller;

import com.ingenieria.dto.CompraDocumentoCreateRequest;
import com.ingenieria.dto.CompraDocumentoDTO;
import com.ingenieria.service.CompraService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/compras")
@RequiredArgsConstructor
public class ComprasController {

    private final CompraService compraService;

    @GetMapping("/tramite/{id}")
    public List<CompraDocumentoDTO> getDocumentos(@PathVariable Long id) {
        return compraService.findDocumentosByTramite(id);
    }

    @PostMapping("/tramite/{id}/documento")
    public ResponseEntity<?> crearDocumento(@PathVariable Long id, @RequestBody CompraDocumentoCreateRequest req) {
        try {
            return ResponseEntity.ok(compraService.crearDocumento(id, req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/documento/{tipo}/{idDocumento}")
    public ResponseEntity<?> eliminarDocumento(
            @PathVariable String tipo,
            @PathVariable Long idDocumento) {
        try {
            compraService.eliminarDocumento(tipo, idDocumento);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/albaran/{id}/generar-factura")
    public ResponseEntity<?> generarFacturaDesdeAlbaran(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(compraService.generarFacturaDesdeAlbaran(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
