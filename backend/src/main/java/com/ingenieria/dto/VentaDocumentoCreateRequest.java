package com.ingenieria.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VentaDocumentoCreateRequest {
    private String tipo; // ALBARAN / FACTURA
    private String numeroDocumento;
    private LocalDate fecha;
    private BigDecimal importe;
    private String notas;
    private Long presupuestoId; // opcional
    private List<VentaDocumentoLineaDTO> lineas; // opcional, por ahora no se persisten
}

