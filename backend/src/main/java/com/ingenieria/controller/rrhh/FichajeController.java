package com.ingenieria.controller.rrhh;

import com.ingenieria.dto.rrhh.EstadoFichajeDTO;
import com.ingenieria.service.rrhh.TimeTrackingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/fichajes")
@PreAuthorize("hasRole('ROLE_USER') or hasRole('ROLE_ADMIN')")
public class FichajeController {

    private final TimeTrackingService timeTrackingService;

    public FichajeController(TimeTrackingService timeTrackingService) {
        this.timeTrackingService = timeTrackingService;
    }

    // Get username from principal
    private String getUsername(Principal principal) {
        return principal != null ? principal.getName() : "anonymous";
    }

    @GetMapping("/estado")
    public ResponseEntity<EstadoFichajeDTO> getEstadoActual(Principal principal) {
        return ResponseEntity.ok(timeTrackingService.obtenerEstadoActual(getUsername(principal)));
    }

    @PostMapping("/iniciar")
    public ResponseEntity<EstadoFichajeDTO> iniciarJornada(Principal principal) {
        return ResponseEntity.ok(timeTrackingService.iniciarJornada(getUsername(principal)));
    }

    @PostMapping("/pausa/iniciar")
    public ResponseEntity<EstadoFichajeDTO> iniciarPausa(Principal principal) {
        return ResponseEntity.ok(timeTrackingService.iniciarPausa(getUsername(principal)));
    }

    @PostMapping("/pausa/finalizar")
    public ResponseEntity<EstadoFichajeDTO> finalizarPausa(Principal principal) {
        return ResponseEntity.ok(timeTrackingService.finalizarPausa(getUsername(principal)));
    }

    @PostMapping("/finalizar")
    public ResponseEntity<EstadoFichajeDTO> finalizarJornada(Principal principal) {
        return ResponseEntity.ok(timeTrackingService.finalizarJornada(getUsername(principal)));
    }
}
