package com.ingenieria.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompraDocumentoDTO {
    private Long idDocumento;
    private String tipo; // ALBARAN / FACTURA
    private Long idProveedor;
    private String proveedorNombre;
    private String numeroDocumento;
    private LocalDate fecha;
    private BigDecimal subtotal;
    private BigDecimal iva;
    private BigDecimal total;
    private String estado; // solo facturas
    private String notas;
    private java.util.List<CompraDocumentoLineaDTO> lineas;
}
