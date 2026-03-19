package com.ingenieria.dto;

import com.ingenieria.model.TecnicoInstalador;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Respuesta para GET /api/tramites/{id}/detalle. Incluye trámite, contrato,
 * cliente y local
 * para pintar la página de detalle (replica detalle_tramite.php).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TramiteDetalleResponse {

    private Long idTramite;
    private Long idContrato;
    private Long idCliente;
    private Long idLocal;
    private String tipoTramite;
    private String estado;
    private String detalleSeguimiento;
    private LocalDateTime fechaCreacion;
    private LocalDate fechaSeguimiento;
    private LocalDateTime fechaEjecucion;
    private String tecnicoAsignado;
    private Boolean esUrgente;

    private String tipoContrato;
    private String observacionesContrato;
    private String cePrevio;
    private String cePost;
    private Boolean mtd;
    private Boolean planos;
    private Boolean enviadoCeePost;
    private String licenciaObras;
    private String subvencionEstado;
    private Boolean libroEdifIncluido;

    private String clienteNombre;
    private String clienteApellido1;
    private String clienteDni;

    private String localDireccion;
    private String localNombreTitular;

    // Fechas Contrato
    private LocalDate fechaInicio;
    private LocalDate fechaVencimiento;

    // Indicador de si la intervención está facturada
    private Boolean facturado;

    private List<TecnicoInstalador> instaladores;
}
