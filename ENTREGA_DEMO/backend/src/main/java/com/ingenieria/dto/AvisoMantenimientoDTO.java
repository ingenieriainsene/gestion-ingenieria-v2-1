package com.ingenieria.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class AvisoMantenimientoDTO {
    private Long idAviso;
    private Long contratoId;
    private LocalDate fechaProgramada;
    private String estado;
    private List<AvisoMantenimientoDetalleDTO> detalles;
}
