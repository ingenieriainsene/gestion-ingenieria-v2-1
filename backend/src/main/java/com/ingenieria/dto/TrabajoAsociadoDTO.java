package com.ingenieria.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrabajoAsociadoDTO {
    private Long idTramite;
    private String tipoTramite;
    private String clienteNombre;
    private String viviendaDireccion;
    private LocalDate fechaSeguimiento;
    private String estado;
}
