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
public class AlbaranVentaDetalleResponse {
    private Long idAlbaran;
    private String numeroAlbaran;
    private LocalDate fecha;
    private BigDecimal subtotal;
    private BigDecimal iva;
    private BigDecimal total;
    private Long presupuestoId;
    private Long tramiteId;
    private List<AlbaranVentaLineaResponse> lineas;
}
