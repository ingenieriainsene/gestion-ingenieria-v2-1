package com.ingenieria.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PresupuestoLineaDTO {
    private Long idLinea;
    private Integer orden;
    private Long productoId;
    private String productoTexto;
    private String concepto;
    private BigDecimal cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal totalLinea;
}
