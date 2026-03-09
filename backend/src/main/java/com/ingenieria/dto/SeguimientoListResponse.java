package com.ingenieria.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** DTO para listar hitos de seguimiento (evita LazyInit al serializar). */
@Data
@NoArgsConstructor
public class SeguimientoListResponse {
    private Long idSeguimiento;
    private Long idTramite;
    private String comentario;
    private LocalDate fechaSeguimiento;
    private Boolean esUrgente;
    private String estado;
    private LocalDateTime fechaRegistro;
    private String nombreAsignado;
    private Long idUsuarioAsignado;
    private String nombreCreador;
    private Long idCreador;
    private Long idProveedor;
    private String nombreProveedor;

    private java.util.List<Long> idsTecnicosInstaladores;
    private java.util.List<String> nombresTecnicosInstaladores;
    private java.util.List<Long> idsUsuariosAsignados;
    private java.util.List<String> nombresUsuariosAsignados;
}
