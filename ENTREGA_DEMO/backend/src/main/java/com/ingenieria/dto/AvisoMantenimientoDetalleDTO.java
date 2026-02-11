package com.ingenieria.dto;

import lombok.Data;

@Data
public class AvisoMantenimientoDetalleDTO {
    private Long idAvisoDet;
    private Long tareaContratoId;
    private String tareaNombre;
    private String estado;
}
