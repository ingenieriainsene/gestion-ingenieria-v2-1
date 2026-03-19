package com.ingenieria.controller.rrhh;

import com.ingenieria.dto.rrhh.CreateEmpleadoRequest;
import com.ingenieria.dto.rrhh.EmpleadoResponse;
import com.ingenieria.dto.rrhh.SolicitarAusenciaRequest;
import com.ingenieria.service.rrhh.HRService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/rrhh")
public class HRController {

    private final HRService hrService;

    public HRController(HRService hrService) {
        this.hrService = hrService;
    }

    @PostMapping("/empleados")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<EmpleadoResponse> onboard(@RequestBody CreateEmpleadoRequest req) {
        return ResponseEntity.ok(hrService.onboardEmployee(req));
    }

    @DeleteMapping("/empleados/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> offboard(@PathVariable UUID id) {
        hrService.offboardEmployee(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/ausencias")
    @PreAuthorize("hasAnyRole('ROLE_USER', 'ROLE_ADMIN')")
    public ResponseEntity<Void> requestAbsence(@RequestBody SolicitarAusenciaRequest req) {
        hrService.requestAbsence(req);
        return ResponseEntity.ok().build();
    }
}
