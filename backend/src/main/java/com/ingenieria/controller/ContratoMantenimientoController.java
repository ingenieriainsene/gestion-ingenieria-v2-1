package com.ingenieria.controller;

import com.ingenieria.dto.AvisoMantenimientoDTO;
import com.ingenieria.dto.ContratoMantenimientoDTO;
import com.ingenieria.dto.GenerarAvisosRequest;
import com.ingenieria.dto.GenerarAvisosResponse;
import com.ingenieria.service.MantenimientoPreventivoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/contratos-mantenimiento")

@RequiredArgsConstructor
public class ContratoMantenimientoController {

    private final MantenimientoPreventivoService service;

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getContractById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/avisos")
    public ResponseEntity<List<AvisoMantenimientoDTO>> getAvisos(@PathVariable Long id) {
        return ResponseEntity.ok(service.getNoticesByContract(id));
    }

    @PostMapping("/{id}/avisos/generar")
    public ResponseEntity<?> generarAvisos(@PathVariable Long id, @RequestBody(required = false) GenerarAvisosRequest req) {
        try {
            LocalDate fin = (req != null) ? req.getHasta() : null;
            GenerarAvisosResponse res = service.generateNoticesForContract(id, fin, req);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
