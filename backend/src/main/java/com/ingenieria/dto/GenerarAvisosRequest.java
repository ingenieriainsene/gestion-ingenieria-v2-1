package com.ingenieria.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class GenerarAvisosRequest {
    private LocalDate hasta;
    private List<TareaInicioOverride> tareas;

    @Data
    public static class TareaInicioOverride {
        private Long tareaContratoId;
        private LocalDate fechaInicio;
    }
}
