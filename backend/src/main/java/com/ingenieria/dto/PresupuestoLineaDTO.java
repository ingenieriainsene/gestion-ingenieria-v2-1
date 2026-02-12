package com.ingenieria.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class PresupuestoLineaDTO {
    private Long idLinea;
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
    private Long padreId;
    private BigDecimal cantidad;
    private Integer numVisitas;
    private BigDecimal precioUnitario;
    private BigDecimal totalLinea;
    private List<PresupuestoLineaDTO> hijos;
}
