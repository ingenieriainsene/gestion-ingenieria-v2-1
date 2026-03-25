package com.ingenieria.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para respuesta de "Añadir a Ventas" y listados de ventas pendientes.
 * Evita serializar la relación LAZY contrato y garantiza idContrato en el JSON.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TramiteVentaResponse {
    private Long idTramite;
    private Long idContrato;
    private String tipoTramite;
    private String estado;
    private String descripcion;
    /** Fecha de creación (auditoría). Para listado Ventas Pendientes. */
    private java.time.LocalDateTime fechaCreacion;
    /** Fecha de seguimiento (inicio). */
    private java.time.LocalDate fechaSeguimiento;
}
