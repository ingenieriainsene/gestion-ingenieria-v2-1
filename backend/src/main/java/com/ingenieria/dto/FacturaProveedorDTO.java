package com.ingenieria.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FacturaProveedorDTO {
    private Long idFactura;
    private String numeroFactura;
    private LocalDate fecha;
    private BigDecimal importe;
    private String estado;
    private Long idTramite;
    private String numeroTramite; // Visual reference
    private String notas;
}
