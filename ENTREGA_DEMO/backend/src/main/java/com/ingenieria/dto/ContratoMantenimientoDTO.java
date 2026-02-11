package com.ingenieria.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ContratoMantenimientoDTO {
    private Long idContratoMant;
    private Long presupuestoPrevId;
    private Long contratoId;
    private Long clienteId;
    private Long viviendaId;
    private LocalDate fechaInicio;
    private String estado;
    private List<ContratoMantenimientoTareaDTO> tareas;
}
