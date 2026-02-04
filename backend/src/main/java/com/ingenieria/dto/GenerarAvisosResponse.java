package com.ingenieria.dto;

import lombok.Data;

import java.util.List;

@Data
public class GenerarAvisosResponse {
    private Long contratoId;
    private List<AvisoMantenimientoDTO> avisos;
}
