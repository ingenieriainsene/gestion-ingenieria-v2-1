package com.ingenieria.controller;

import com.ingenieria.model.TecnicoInstalador;
import com.ingenieria.service.TecnicoInstaladorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tecnicos-instaladores")
@CrossOrigin(origins = "*")
public class TecnicoInstaladorController {

    @Autowired
    private TecnicoInstaladorService service;

    @GetMapping
    public List<TecnicoInstalador> getAll() {
        return service.findAll();
    }

    @GetMapping("/activos")
    public List<TecnicoInstalador> getActivos() {
        return service.findActivos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TecnicoInstalador> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public TecnicoInstalador create(@RequestBody TecnicoInstalador tecnico) {
        return service.save(tecnico);
    }

    @PutMapping("/{id}")
    public TecnicoInstalador update(@PathVariable Long id, @RequestBody TecnicoInstalador tecnico) {
        tecnico.setIdTecnicoInstalador(id);
        return service.save(tecnico);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
