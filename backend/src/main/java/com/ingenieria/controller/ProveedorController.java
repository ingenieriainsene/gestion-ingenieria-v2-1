package com.ingenieria.controller;

import com.ingenieria.dto.ProveedorDTO;
import com.ingenieria.model.Proveedor;
import com.ingenieria.service.ProveedorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/proveedores")
@CrossOrigin(origins = "http://localhost:4200")
public class ProveedorController {

    @Autowired
    private ProveedorService service;

    @GetMapping
    public List<Proveedor> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Proveedor getById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public ResponseEntity<Proveedor> create(@RequestBody ProveedorDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }
}
