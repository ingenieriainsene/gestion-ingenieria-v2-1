package com.ingenieria.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class PresupuestoLineaDTO {
    private UUID idLinea;
    private Integer orden;
    private Long productoId;
    private String productoTexto;
    private String concepto;
    private BigDecimal ivaPorcentaje;
    private BigDecimal costeUnitario;
    private BigDecimal factorMargen;
    private BigDecimal totalCoste;
    private BigDecimal pvpUnitario;
    private BigDecimal totalPvp;
    private BigDecimal importeIva;
    private BigDecimal totalFinal;
    private String tipoJerarquia;
    private String codigoVisual;
    private UUID padreId;
    private BigDecimal cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal totalLinea;
    private List<PresupuestoLineaDTO> hijos;
}
