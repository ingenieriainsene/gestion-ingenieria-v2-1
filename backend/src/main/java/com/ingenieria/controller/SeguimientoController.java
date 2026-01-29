package com.ingenieria.controller;

import com.ingenieria.dto.SeguimientoDTO;
import com.ingenieria.dto.SeguimientoListResponse;
import com.ingenieria.service.SeguimientoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seguimiento")
@CrossOrigin(origins = "http://localhost:4200")
public class SeguimientoController {

    @Autowired
    private SeguimientoService service;

    @GetMapping("/tramite/{idTramite}")
    public List<SeguimientoListResponse> getByTramite(@PathVariable Long idTramite) {
        return service.findDtosByTramite(idTramite);
    }

    @PostMapping
    public ResponseEntity<SeguimientoListResponse> create(@RequestBody SeguimientoDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
