package com.ingenieria.dto;

import lombok.Data;

@Data
public class ContratoMantenimientoTareaDTO {
    private Long idTareaContrato;
    private String nombre;
    private String descripcion;
    private Integer frecuenciaMeses;
    private Integer orden;
    private Boolean activo;
}
