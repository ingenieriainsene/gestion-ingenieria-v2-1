package com.ingenieria.controller;

import com.ingenieria.dto.AlbaranVentaResponse;
import com.ingenieria.service.AlbaranVentaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/albaranes-venta")
@RequiredArgsConstructor
public class AlbaranVentaController {

    private final AlbaranVentaService albaranVentaService;

    @PostMapping("/presupuesto/{id}")
    public ResponseEntity<?> crearDesdePresupuesto(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String usuarioBd = auth != null ? auth.getName() : "sistema";
        try {
            return ResponseEntity.ok(albaranVentaService.crearDesdePresupuesto(id, usuarioBd));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/tramite/{id}")
    public List<AlbaranVentaResponse> getByTramite(@PathVariable Long id) {
        return albaranVentaService.findByTramite(id);
    }
}
