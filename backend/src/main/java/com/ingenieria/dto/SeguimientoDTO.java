package com.ingenieria.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class SeguimientoDTO {
    private Long idSeguimiento;
    private Long idTramite;
    private Long idUsuarioAsignado; // Técnico
    private Long idProveedor; // Subcontrata
    private String comentario;
    private LocalDate fechaSeguimiento;
    private Boolean esUrgente;
    private String estado;
    private java.util.List<Long> idsTecnicosInstaladores;
    private java.util.List<Long> idsUsuariosAsignados;

    // Read-only fields for UI
    private String nombreTramite;
    private String nombreAsignado;
    private LocalDateTime fechaRegistro;
}
