package com.ingenieria.controller;

import com.ingenieria.model.AuditoriaSistema;
import com.ingenieria.service.AuditoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auditoria")
public class AuditoriaController {

    @Autowired
    private AuditoriaService auditoriaService;

    @GetMapping
    public ResponseEntity<List<AuditoriaSistema>> obtenerAuditoria() {
        return ResponseEntity.ok(auditoriaService.obtenerTodaAuditoria());
    }
}
