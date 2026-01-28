package com.ingenieria.dto;

import lombok.Data;

import java.time.LocalDate;

/**
 * DTO de entrada para crear/actualizar contratos (equivalente a guardar_contrato.php / actualizar_contrato.php).
 * El frontend envía IDs (idCliente/idLocal) en lugar de objetos JPA anidados.
 */
@Data
public class ContratoRequest {
    private Long idCliente;
    private Long idLocal;

    private LocalDate fechaInicio;
    private LocalDate fechaVencimiento;
    private String tipoContrato;

    // Campos adicionales del DDL (se irán usando en "gestionar contrato")
    private String cePrevio;
    private String cePost;
    private Boolean enviadoCeePost;
    private String licenciaObras;
    private Boolean mtd;
    private Boolean planos;
    private String subvencionEstado;
    private Boolean libroEdifIncluido;
    private String observaciones;
}

