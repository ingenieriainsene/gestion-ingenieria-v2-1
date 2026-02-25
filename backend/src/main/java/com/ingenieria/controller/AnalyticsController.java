package com.ingenieria.controller;

import com.ingenieria.dto.AnalyticsTramiteDTO;
import com.ingenieria.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador de solo lectura para el módulo de Análisis de Datos.
 * Expone únicamente métodos GET. No realiza mutaciones sobre los datos.
 *
 * Ruta base: /api/analytics
 */
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * GET /api/analytics/tramites
     *
     * Devuelve una página de intervenciones (trámites) enriquecidas con datos de
     * contrato, cliente y local. Todos los filtros son opcionales.
     *
     * @param tipoTramite filtro parcial por tipo de intervención (ej.
     *                    "Legalización")
     * @param estado      filtro parcial por estado (ej. "En proceso")
     * @param tecnico     filtro parcial por técnico asignado
     * @param fechaDesde  inicio del rango de fechaCreacion (YYYY-MM-DD)
     * @param fechaHasta  fin del rango de fechaCreacion (YYYY-MM-DD)
     * @param page        número de página 0-based (default 0)
     * @param size        elementos por página (default 20, máx 100)
     * @param sort        campo de ordenamiento (default "fechaCreacion")
     * @param dir         dirección: "asc" o "desc" (default "desc")
     */
    @GetMapping("/tramites")
    public ResponseEntity<Page<AnalyticsTramiteDTO>> getTramites(
            @RequestParam(required = false) String tipoTramite,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String tecnico,
            @RequestParam(required = false) String fechaDesde,
            @RequestParam(required = false) String fechaHasta,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "fechaCreacion") String sort,
            @RequestParam(defaultValue = "desc") String dir) {
        Page<AnalyticsTramiteDTO> result = analyticsService.findFiltered(
                tipoTramite, estado, tecnico, fechaDesde, fechaHasta,
                page, size, sort, dir);
        return ResponseEntity.ok(result);
    }
}
