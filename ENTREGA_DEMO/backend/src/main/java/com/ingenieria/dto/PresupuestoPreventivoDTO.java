package com.ingenieria.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class PresupuestoPreventivoDTO {
    private Long idPresupuestoPrev;
    private Long clienteId;
    private Long viviendaId;
    private LocalDate fecha;
    private String estado;
    private String notas;
    private List<PresupuestoPreventivoTareaDTO> tareas;
}
