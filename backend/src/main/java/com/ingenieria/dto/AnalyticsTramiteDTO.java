package com.ingenieria.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsTramiteDTO {

    private Long idTramite;
    private Long idContrato;
    private String tipoTramite;
    private String estado;
    private Boolean esUrgente;
    private Boolean facturado;

    /** Marca de tiempo de creación del trámite (inicio del ciclo de vida). */
    private LocalDateTime fechaCreacion;

    /** Fecha de ejecución/finalización real del trámite. */
    private LocalDateTime fechaEjecucion;

    /**
     * Duración calculada en días entre fechaCreacion y fechaEjecucion.
     * Null si el trámite aún no tiene fecha de ejecución.
     */
    private Long duracionDias;

    // --- Datos del contrato / cliente / local ---
    private String tipoContrato;
    private String nombreCliente;
    private String apellido1Cliente;
    private String dniCliente;
    private String direccionLocal;

    /** Técnico asignado (campo legacy en TRAMITES_CONTRATO). */
    private String tecnicoAsignado;

    private String descripcion;
}
