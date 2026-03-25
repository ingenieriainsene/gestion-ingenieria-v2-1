package com.ingenieria.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Data
public class PresupuestoDTO {
    private Long idPresupuesto;
    private Long clienteId;
    private Long viviendaId;
    private String codigoReferencia;
    private LocalDate fecha;
    private BigDecimal total;
    private BigDecimal totalSinIva;
    private BigDecimal totalConIva;
    private String estado;
    private String tipoPresupuesto;
    private String descripcion;
    private OffsetDateTime fechaAceptacion;
    private Integer diasValidez;
    private Long tramiteId;
    private List<PresupuestoLineaDTO> lineas;
}
