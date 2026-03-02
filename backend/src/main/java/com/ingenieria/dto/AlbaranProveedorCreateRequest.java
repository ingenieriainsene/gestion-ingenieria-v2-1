package com.ingenieria.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class AlbaranProveedorCreateRequest {
    private Long idProveedor;
    private String numeroAlbaran;
    private LocalDate fecha;
    private BigDecimal importe;
    private String notas;
}
