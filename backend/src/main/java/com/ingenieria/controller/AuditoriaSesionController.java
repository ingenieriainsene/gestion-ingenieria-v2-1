package com.ingenieria.controller;

import com.ingenieria.model.AuditoriaSesion;
import com.ingenieria.service.AuditoriaSesionService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auditoria-sesiones")
public class AuditoriaSesionController {

    private final AuditoriaSesionService auditoriaSesionService;

    public AuditoriaSesionController(AuditoriaSesionService auditoriaSesionService) {
        this.auditoriaSesionService = auditoriaSesionService;
    }

    @GetMapping
    public ResponseEntity<Page<AuditoriaSesion>> listarSesiones(
            @PageableDefault(
                    page = 0,
                    size = 20,
                    sort = "fechaInicio",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        Page<AuditoriaSesion> page = auditoriaSesionService.getSesiones(pageable);
        return ResponseEntity.ok(page);
    }
}
