package com.ingenieria.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO para el Mapa Visual de Intervenciones (En proceso / Terminado).
 * Replica la consulta $res_activas de gestionar_contrato.php.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TramiteMapaResponse {
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
