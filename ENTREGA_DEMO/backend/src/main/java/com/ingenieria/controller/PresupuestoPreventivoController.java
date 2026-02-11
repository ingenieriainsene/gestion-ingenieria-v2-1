package com.ingenieria.controller;

import com.ingenieria.dto.ContratoMantenimientoDTO;
import com.ingenieria.dto.PresupuestoPreventivoDTO;
import com.ingenieria.service.MantenimientoPreventivoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/presupuestos-preventivos")

@RequiredArgsConstructor
public class PresupuestoPreventivoController {

    private final MantenimientoPreventivoService service;

    @GetMapping
    public List<PresupuestoPreventivoDTO> getAll() {
        return service.findAllBudgets();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.findBudgetById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody PresupuestoPreventivoDTO dto) {
        try {
            return ResponseEntity.ok(service.createBudget(dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody PresupuestoPreventivoDTO dto) {
        try {
            return ResponseEntity.ok(service.updateBudget(id, dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable Long id) {
        try {
            ContratoMantenimientoDTO contrato = service.approveBudgetAndCreateContract(id);
            return ResponseEntity.ok(contrato);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/contrato")
    public ResponseEntity<?> getContrato(@PathVariable Long id) {
        ContratoMantenimientoDTO contrato = service.getContractByBudget(id);
        if (contrato == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(contrato);
    }
}
