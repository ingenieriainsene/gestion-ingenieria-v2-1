package com.ingenieria.controller;

import com.ingenieria.model.AreaFuncional;
import com.ingenieria.model.AreaFuncionalLinea;
import com.ingenieria.service.AreaFuncionalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/areas-funcionales")
@CrossOrigin(origins = "*")
public class AreaFuncionalController {

    @Autowired
    private AreaFuncionalService service;

    @GetMapping("/local/{idLocal}")
    public ResponseEntity<List<AreaFuncional>> getByLocal(@PathVariable Long idLocal) {
        return ResponseEntity.ok(service.findAllByLocalId(idLocal));
    }

    @PostMapping("/local/{idLocal}")
    public ResponseEntity<AreaFuncional> createArea(@PathVariable Long idLocal, @RequestBody AreaFuncional area) {
        return ResponseEntity.ok(service.createArea(idLocal, area));
    }

    @PutMapping("/{idArea}")
    public ResponseEntity<AreaFuncional> updateArea(@PathVariable Long idArea, @RequestBody AreaFuncional area) {
        return ResponseEntity.ok(service.updateArea(idArea, area));
    }

    @DeleteMapping("/{idArea}")
    public ResponseEntity<Void> deleteArea(@PathVariable Long idArea) {
        service.deleteArea(idArea);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{idArea}/lineas")
    public ResponseEntity<AreaFuncionalLinea> addLinea(@PathVariable Long idArea,
            @RequestBody AreaFuncionalLinea linea) {
        return ResponseEntity.ok(service.addLinea(idArea, linea));
    }

    @PutMapping("/lineas/{idLinea}")
    public ResponseEntity<AreaFuncionalLinea> updateLinea(@PathVariable Long idLinea,
            @RequestBody AreaFuncionalLinea linea) {
        return ResponseEntity.ok(service.updateLinea(idLinea, linea));
    }

    @DeleteMapping("/lineas/{idLinea}")
    public ResponseEntity<Void> deleteLinea(@PathVariable Long idLinea) {
        service.deleteLinea(idLinea);
        return ResponseEntity.noContent().build();
    }
}
