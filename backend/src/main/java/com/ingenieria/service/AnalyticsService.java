package com.ingenieria.service;

import com.ingenieria.dto.AnalyticsTramiteDTO;
import com.ingenieria.model.Tramite;
import com.ingenieria.repository.AnalyticsRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Servicio de solo lectura para el módulo de Análisis de Datos.
 * Usa la Criteria API (Specification) para construir los filtros dinámicos,
 * lo que evita todos los problemas de Hibernate 6 con parámetros nulos en JPQL
 * y la ambigüedad en el ORDER BY al hacer JOIN con varias entidades.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    private final AnalyticsRepository analyticsRepository;

    public Page<AnalyticsTramiteDTO> findFiltered(
            String tipoTramite,
            String estado,
            String tecnico,
            String fechaDesde,
            String fechaHasta,
            int page,
            int size,
            String sortField,
            String sortDir) {

        int clampedSize = Math.min(size, 100);

        String resolvedSort = resolveSort(sortField);
        Sort sort = "desc".equalsIgnoreCase(sortDir)
                ? Sort.by(resolvedSort).descending()
                : Sort.by(resolvedSort).ascending();

        Pageable pageable = PageRequest.of(page, clampedSize, sort);

        Specification<Tramite> spec = buildSpec(tipoTramite, estado, tecnico,
                parseDate(fechaDesde, false), parseDate(fechaHasta, true));

        return analyticsRepository.findAll(spec, pageable).map(this::toDTO);
    }

    // ────────────────────────────────────────
    // Specification builder
    // ────────────────────────────────────────

    private Specification<Tramite> buildSpec(
            String tipoTramite,
            String estado,
            String tecnico,
            LocalDateTime fechaDesde,
            LocalDateTime fechaHasta) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Forzar JOIN con Contrato, Cliente y Local para que estén disponibles
            // (inner join: sólo trámites con contrato válido)
            Join<?, ?> contrato = root.join("contrato", JoinType.INNER);
            contrato.join("cliente", JoinType.LEFT);
            contrato.join("local", JoinType.LEFT);

            // Filtro: tipo de trámite (LIKE parcial, case-insensitive)
            if (hasText(tipoTramite)) {
                predicates.add(cb.like(
                        cb.lower(root.get("tipoTramite")),
                        "%" + tipoTramite.trim().toLowerCase() + "%"));
            }

            // Filtro: estado (LIKE parcial, case-insensitive)
            if (hasText(estado)) {
                predicates.add(cb.like(
                        cb.lower(root.get("estado")),
                        "%" + estado.trim().toLowerCase() + "%"));
            }

            // Filtro: técnico asignado (LIKE parcial, case-insensitive)
            if (hasText(tecnico)) {
                predicates.add(cb.like(
                        cb.lower(root.get("tecnicoAsignado")),
                        "%" + tecnico.trim().toLowerCase() + "%"));
            }

            // Filtro: rango de fechaCreacion
            if (fechaDesde != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("fechaCreacion"), fechaDesde));
            }
            if (fechaHasta != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("fechaCreacion"), fechaHasta));
            }

            // Evitar duplicados si Hibernate genera un CROSS JOIN implícito
            if (query != null) {
                query.distinct(true);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    // ────────────────────────────────────────
    // Mapping
    // ────────────────────────────────────────

    private AnalyticsTramiteDTO toDTO(Tramite t) {
        var c = t.getContrato();
        var cl = c != null ? c.getCliente() : null;
        var l = c != null ? c.getLocal() : null;

        Long duracion = null;
        if (t.getFechaCreacion() != null && t.getFechaEjecucion() != null) {
            duracion = ChronoUnit.DAYS.between(t.getFechaCreacion(), t.getFechaEjecucion());
        }

        return new AnalyticsTramiteDTO(
                t.getIdTramite(),
                c != null ? c.getIdContrato() : null,
                t.getTipoTramite(),
                t.getEstado(),
                t.getEsUrgente(),
                t.getFacturado(),
                t.getFechaCreacion(),
                t.getFechaEjecucion(),
                duracion,
                c != null ? c.getTipoContrato() : null,
                cl != null ? cl.getNombre() : null,
                cl != null ? cl.getApellido1() : null,
                cl != null ? cl.getDni() : null,
                l != null ? l.getDireccionCompleta() : null,
                t.getTecnicoAsignado(),
                t.getDetalleSeguimiento());
    }

    // ────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────

    private LocalDateTime parseDate(String raw, boolean endOfDay) {
        if (!hasText(raw))
            return null;
        try {
            LocalDate d = LocalDate.parse(raw.trim());
            return endOfDay ? d.atTime(23, 59, 59) : d.atStartOfDay();
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    private String resolveSort(String field) {
        if (field == null)
            return "fechaCreacion";
        return switch (field.trim()) {
            case "idTramite" -> "idTramite";
            case "tipoTramite" -> "tipoTramite";
            case "estado" -> "estado";
            case "fechaEjecucion" -> "fechaEjecucion";
            case "tecnicoAsignado" -> "tecnicoAsignado";
            default -> "fechaCreacion";
        };
    }

    private boolean hasText(String s) {
        return s != null && !s.isBlank();
    }
}
