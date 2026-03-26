package com.ingenieria.controller;

import com.ingenieria.dto.TramiteDetalleResponse;
import com.ingenieria.dto.TramiteVentaResponse;
import com.ingenieria.model.Tramite;
import com.ingenieria.service.TramiteService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tramites")
@RequiredArgsConstructor
public class TramiteController {

    private static final Logger log = LoggerFactory.getLogger(TramiteController.class);
    private final TramiteService tramiteService;

    @GetMapping
    public List<Tramite> getAll() {
        return tramiteService.findAll();
    }

    @GetMapping("/contrato/{id}")
    public List<Tramite> getByContrato(@PathVariable Long id) {
        return tramiteService.findByContratoId(id);
    }

    @GetMapping("/local/{id}")
    public List<com.ingenieria.dto.TramiteContratoResponse> getByLocal(@PathVariable Long id) {
        return tramiteService.findAllByLocalId(id);
    }

    @GetMapping("/ventas-pendientes")
    public List<TramiteVentaResponse> getVentasPendientes() {
        return tramiteService.findVentasPendientesResponse();
    }

    @GetMapping("/list")
    public List<com.ingenieria.dto.TramiteListResponse> getList() {
        return tramiteService.findAllList();
    }

    /**
     * Detalle completo para la página de detalle (replica detalle_tramite.php).
     * Declarado antes que /{id} para que Spring matchee /{id}/detalle
     * correctamente.
     */
    @GetMapping("/{id}/detalle")
    public ResponseEntity<?> getDetalle(@PathVariable Long id) {
        try {
            TramiteDetalleResponse dto = tramiteService.findDetalleById(id);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            log.warn("GET /api/tramites/{}/detalle falló: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Trámite no encontrado"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tramite> getById(@PathVariable Long id) {
        return tramiteService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Tramite create(@RequestBody Tramite tramite) {
        return tramiteService.save(tramite);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Tramite> update(@PathVariable Long id, @RequestBody Tramite body) {
        return ResponseEntity.ok(tramiteService.updateBasicFields(id, body));
    }

    // La subida de archivos se maneja en ArchivoController
    // (/api/archivos/tramite/{id})

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        tramiteService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Marca o desmarca un trámite como "venta pendiente".
     */
    @PatchMapping("/{id}/marcar-venta")
    public ResponseEntity<Tramite> marcarVenta(
            @PathVariable Long id,
            @RequestParam(name = "activo", defaultValue = "true") boolean activo) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String usuarioBd = auth != null ? auth.getName() : "sistema";

        Tramite actualizado = tramiteService.marcarComoVentaPendiente(id, activo, usuarioBd);
        return ResponseEntity.ok(actualizado);
    }

    /**
     * Endpoint de "Gestión de Intervención" para avanzar el estado:
     * Pendiente -> En proceso -> Terminado
     * y registrar auditoría usando el usuario autenticado.
     */
    @PostMapping("/{id}/avanzar-estado")
    public ResponseEntity<Tramite> avanzarEstado(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String usuarioBd = auth != null ? auth.getName() : "sistema";

        Tramite actualizado = tramiteService.avanzarEstado(id, usuarioBd);
        return ResponseEntity.ok(actualizado);
    }

    /**
     * Generar: UPDATE real en BD. Pasa el trámite de Pendiente a En proceso.
     * Replica gestionar_contrato.php
     * (acciones_tramites?accion=ejecutar). @Transactional en servicio.
     */
    @PostMapping("/{id}/generar")
    public ResponseEntity<?> generar(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String usuarioBd = auth != null ? auth.getName() : "sistema";

        try {
            TramiteVentaResponse dto = tramiteService.generar(id, usuarioBd);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/instaladores/{idInstalador}")
    public ResponseEntity<Tramite> asignarInstalador(@PathVariable Long id, @PathVariable Long idInstalador) {
        return ResponseEntity.ok(tramiteService.asignarInstalador(id, idInstalador));
    }

    @DeleteMapping("/{id}/instaladores/{idInstalador}")
    public ResponseEntity<Tramite> desvincularInstalador(@PathVariable Long id, @PathVariable Long idInstalador) {
        return ResponseEntity.ok(tramiteService.desvincularInstalador(id, idInstalador));
    }

    /**
     * Condiciona un trámite a otro.
     */
    @PatchMapping("/{id}/condicionar")
    public ResponseEntity<Tramite> condicionar(
            @PathVariable Long id,
            @RequestParam(name = "idBloqueante", required = false) Long idBloqueante) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String usuarioBd = auth != null ? auth.getName() : "sistema";

        Tramite actualizado = tramiteService.condicionar(id, idBloqueante, usuarioBd);
        return ResponseEntity.ok(actualizado);
    }
}
