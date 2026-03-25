package com.ingenieria.dto;

import lombok.Data;

/**
 * DTO para el endpoint "Añadir a Ventas" en la ficha de contrato.
 * Crea una nueva intervención (trámite) con estado "Pendiente" que aparece en Ventas Pendientes.
 */
@Data
public class AnadirAVentasRequest {
    private String tipoTramite;
    private String descripcion;
}
