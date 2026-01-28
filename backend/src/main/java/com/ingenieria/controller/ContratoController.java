package com.ingenieria.controller;

import com.ingenieria.dto.AnadirAVentasRequest;
import com.ingenieria.dto.ContratoRequest;
import com.ingenieria.dto.TramiteContratoResponse;
import com.ingenieria.dto.TramiteMapaResponse;
import com.ingenieria.dto.TramiteVentaResponse;
import com.ingenieria.model.Contrato;
import com.ingenieria.model.Tramite;
import com.ingenieria.service.ContratoService;
import com.ingenieria.service.TramiteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/contratos")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class ContratoController {

    private final ContratoService service;
    private final TramiteService tramiteService;

    @GetMapping
    public List<Contrato> getAll() { return service.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Contrato> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody ContratoRequest req) {
        try {
            return ResponseEntity.ok(service.createFromRequest(req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody ContratoRequest req) {
        try {
            return ResponseEntity.ok(service.updateFromRequest(id, req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Todos los trámites del contrato (cualquier estado). Única fuente de verdad.
     * El frontend distribuye: Pendiente → Ventas Pendientes; En proceso / Terminado → Mapa Visual.
     */
    @GetMapping("/{id}/tramites")
    public List<TramiteContratoResponse> getTramitesPorContrato(@PathVariable Long id) {
        return tramiteService.findAllByContratoId(id);
    }

    /**
     * Devuelve los trámites pendientes (estado "Pendiente") de este contrato.
     * Usado por el panel "Ventas Pendientes" en la ficha del contrato.
     */
    @GetMapping("/{id}/tramites-pendientes")
    public List<TramiteVentaResponse> getTramitesPendientes(@PathVariable Long id) {
        return tramiteService.findPendientesByContratoId(id);
    }

    /**
     * Devuelve los trámites activos (En proceso, Terminado) para el Mapa Visual.
     * Replica $res_activas de gestionar_contrato.php.
     */
    @GetMapping("/{id}/tramites-activos")
    public List<TramiteMapaResponse> getTramitesActivos(@PathVariable Long id) {
        return tramiteService.findActivosByContratoId(id);
    }

    /**
     * Añadir a Ventas: crea una nueva intervención (trámite) con estado "Pendiente"
     * para el contrato indicado. Aparece en Ventas Pendientes.
     */
    @PostMapping("/{id}/anadir-a-ventas")
    public ResponseEntity<?> anadirAVentas(@PathVariable Long id, @RequestBody AnadirAVentasRequest req) {
        return crearTramitePendiente(id, req);
    }

    /**
     * Crea una nueva intervención (trámite) con estado "Pendiente" para el contrato.
     * Replica la ruta POST de gestionar_contrato.php (acciones_tramites crear).
     * Body: { "tipoTramite": string, "detalleSeguimiento"?: string }
     */
    @PostMapping("/{id}/tramites")
    public ResponseEntity<?> crearTramite(@PathVariable Long id, @RequestBody AnadirAVentasRequest req) {
        return crearTramitePendiente(id, req);
    }

    /**
     * Replica acciones_tramites.php?accion=crear. Persiste id_contrato y estado = 'Pendiente' en MySQL.
     * TramiteService.save es @Transactional.
     */
    private ResponseEntity<?> crearTramitePendiente(Long id, AnadirAVentasRequest req) {
        if (req == null || req.getTipoTramite() == null || req.getTipoTramite().isBlank()) {
            return ResponseEntity.badRequest().body("tipoTramite es obligatorio");
        }
        Contrato c = service.findById(id);
        Tramite t = new Tramite();
        t.setContrato(c);
        t.setTipoTramite(req.getTipoTramite().trim());
        t.setDetalleSeguimiento(req.getDetalleSeguimiento() != null ? req.getDetalleSeguimiento().trim() : null);
        t.setEstado("Pendiente");
        t.setFechaSeguimiento(LocalDate.now());
        t.setEsUrgente(false);
        Tramite saved = tramiteService.save(t);
        TramiteVentaResponse res = new TramiteVentaResponse(
                saved.getIdTramite(),
                c.getIdContrato(),
                saved.getTipoTramite(),
                saved.getEstado(),
                saved.getDetalleSeguimiento(),
                saved.getFechaCreacion(),
                saved.getFechaSeguimiento()
        );
        return ResponseEntity.ok(res);
    }
}
