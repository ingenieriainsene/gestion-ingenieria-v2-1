package com.ingenieria.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CompraDocumentoCreateRequest {
    private String tipo; // ALBARAN / FACTURA
    private Long idProveedor;
    private String numeroDocumento;
    private LocalDate fecha;
    private BigDecimal importe;
    private String estado;
    private String notas;
    private java.util.List<CompraDocumentoLineaDTO> lineas;
}
