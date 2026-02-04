package com.ingenieria.dto;

import lombok.Data;

@Data
public class PresupuestoPreventivoTareaDTO {
    private Long idTareaPrev;
    private String nombre;
    private String descripcion;
    private Integer frecuenciaMeses;
    private Integer orden;
    private Boolean activo;
}
