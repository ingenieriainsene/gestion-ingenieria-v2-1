package com.ingenieria.controller;

import com.ingenieria.model.AuditoriaSesion;
import com.ingenieria.repository.AuditoriaSesionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auditoria-sesiones")
public class AuditoriaSesionController {

    @Autowired
    private AuditoriaSesionRepository auditoriaSesionRepository;

    @GetMapping
    public ResponseEntity<List<AuditoriaSesion>> listarSesiones() {
        return ResponseEntity.ok(auditoriaSesionRepository.findAllByOrderByFechaInicioDesc());
    }
}
