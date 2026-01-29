package com.ingenieria.dto;

import lombok.Data;

import java.util.List;

/**
 * DTO exclusivo para POST /api/proveedores.
 * Los nombres de los campos deben coincidir 100% con el formulario Angular.
 */
@Data
public class ProveedorCreateRequest {
    private String nombreComercial;
    private String razonSocial;
    private String cif;
    private String direccionFiscal;
    private Boolean esAutonomo;
    private List<String> oficios;
    private List<ContactoDTO> contactos;
}
