package com.ingenieria.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VentaDocumentoLineaDTO {
    private String concepto;
    private BigDecimal cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal ivaPorcentaje;
    private BigDecimal totalLinea;
    private BigDecimal totalIva;
    private BigDecimal totalConIva;
}

