package com.ingenieria.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO para listar todos los trámites de un contrato (cualquier estado).
 * Única fuente de verdad: el frontend distribuye por estado (Pendiente → Ventas, En proceso/Terminado → Mapa).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TramiteContratoResponse {
    private Long idTramite;
    private Long idContrato;
    private String tipoTramite;
    private String estado;
    private String descripcion;
    private LocalDateTime fechaCreacion;
    private LocalDate fechaSeguimiento;
    private LocalDateTime fechaEjecucion;
    private String tecnicoAsignado;
}
