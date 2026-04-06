package com.ingenieria.dto;

import lombok.Data;

/**
 * DTO de entrada para crear/actualizar locales.
 * El frontend envía idCliente en lugar del objeto Cliente anidado.
 */
@Data
public class LocalRequest {
    private Long idCliente;
    private String nombreTitular;
    private String apellido1Titular;
    private String apellido2Titular;
    private String direccionCompleta;
    private String codigoPostal;
    private String localidad;
    private String provincia;
    private String cups;
    private String referenciaCatastral;
}
