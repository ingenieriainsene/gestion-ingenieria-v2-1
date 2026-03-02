package com.ingenieria.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlbaranProveedorCompraDTO {
    private Long idAlbaran;
    private Long idProveedor;
    private String proveedorNombre;
    private String numeroAlbaran;
    private LocalDate fecha;
    private BigDecimal importe;
    private String notas;
}
