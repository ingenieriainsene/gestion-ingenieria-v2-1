package com.ingenieria.controller;

import com.ingenieria.dto.LocalRequest;
import com.ingenieria.model.Local;
import com.ingenieria.service.LocalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/locales")

public class LocalController {
    @Autowired
    private LocalService service;

    @GetMapping
    public List<Local> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Local> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody LocalRequest req) {
        try {
            return ResponseEntity.ok(service.createFromRequest(req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody LocalRequest req) {
        try {
            return ResponseEntity.ok(service.updateFromRequest(id, req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/check-rc/{rc}")
    public ResponseEntity<Local> getByRC(@PathVariable String rc) {
        Local l = service.findByReferenciaCatastral(rc);
        return l != null ? ResponseEntity.ok(l) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
