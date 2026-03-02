package com.ingenieria.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlbaranVentaResponse {
    private Long idAlbaran;
    private String numeroAlbaran;
    private LocalDate fecha;
    private BigDecimal importe;
    private Long presupuestoId;
    private Long tramiteId;
    private boolean existente;
}
