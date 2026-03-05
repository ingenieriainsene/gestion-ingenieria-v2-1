package com.ingenieria.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContabilidadVentaDTO {
    private Long id;
    private String tipo; // ALBARAN / FACTURA
    private String numero;
    private LocalDate fecha;
    private String cliente;
    private Long contratoId;
    private BigDecimal total;
}

