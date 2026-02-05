package com.ingenieria.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CitaDTO {
    private Long idCita;
    private Long clienteId;
    private Long usuarioId;
    private String titulo;
    private String estado;
    private String enlaceRemoto;
    private String notas;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;
    private Integer recordatorioMin;
}
