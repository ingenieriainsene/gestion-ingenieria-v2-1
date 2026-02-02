package com.ingenieria.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class PresupuestoDTO {
    private Long idPresupuesto;
    private Long clienteId;
    private Long viviendaId;
    private String codigoReferencia;
    private LocalDate fecha;
    private BigDecimal total;
    private String estado;
    private List<PresupuestoLineaDTO> lineas;
}
