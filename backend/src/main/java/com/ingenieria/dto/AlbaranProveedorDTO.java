package com.ingenieria.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlbaranProveedorDTO {
    private Long idAlbaran;
    private String numeroAlbaran;
    private LocalDate fecha;
    private BigDecimal importe;
    private Long idTramite;
    private String numeroTramite; // Visual reference if needed
    private String notas;
}
