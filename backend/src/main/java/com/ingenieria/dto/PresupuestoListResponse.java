package com.ingenieria.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PresupuestoListResponse {
    private Long idPresupuesto;
    private String codigoReferencia;
    private LocalDate fecha;
    private BigDecimal total;
    private String estado;
    private Long clienteId;
    private String clienteNombre;
    private Long viviendaId;
    private String viviendaDireccion;
    private String tipoLinea;
    private String productoNombre;
}
