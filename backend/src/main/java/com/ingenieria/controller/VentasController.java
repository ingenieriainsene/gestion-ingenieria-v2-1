package com.ingenieria.controller;

import com.ingenieria.dto.VentaDocumentoCreateRequest;
import com.ingenieria.dto.VentaDocumentoDTO;
import com.ingenieria.service.VentaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ventas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class VentasController {

    private final VentaService ventaService;

    @GetMapping("/tramite/{idTramite}/documentos")
    public ResponseEntity<List<VentaDocumentoDTO>> listarPorTramite(@PathVariable Long idTramite) {
        return ResponseEntity.ok(ventaService.findByTramite(idTramite));
    }

    @PostMapping("/tramite/{idTramite}/documentos")
    public ResponseEntity<VentaDocumentoDTO> crearDocumento(
            @PathVariable Long idTramite,
            @RequestBody VentaDocumentoCreateRequest request
    ) {
        return ResponseEntity.ok(ventaService.crearDocumento(idTramite, request));
    }

    @PostMapping("/albaran/{idAlbaran}/generar-factura")
    public ResponseEntity<VentaDocumentoDTO> generarFacturaDesdeAlbaran(@PathVariable Long idAlbaran) {
        return ResponseEntity.ok(ventaService.generarFacturaDesdeAlbaran(idAlbaran));
    }
}

