package com.ingenieria.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TramiteListResponse {
    private Long idTramite;
    private Long idContrato;
    private String tipoTramite;
    private String estado;
    private LocalDate fechaSeguimiento;
    private Boolean esUrgente;
    private String tecnicoAsignado;
    private String nombreCliente;
    private String direccionLocal;
    private String detalleSeguimiento;
}
