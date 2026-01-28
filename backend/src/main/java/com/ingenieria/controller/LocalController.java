package com.ingenieria.controller;

import com.ingenieria.model.Local;
import com.ingenieria.service.LocalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/locales")
public class LocalController {
    @Autowired private LocalService service;

    @GetMapping
    public List<Local> getAll() { return service.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Local> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<Local> create(@RequestBody Local local) {
        return ResponseEntity.ok(service.save(local));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
