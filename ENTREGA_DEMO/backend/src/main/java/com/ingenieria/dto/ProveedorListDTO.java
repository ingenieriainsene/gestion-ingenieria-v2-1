package com.ingenieria.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO plano para listado (GET /api/proveedores).
 * Sin entidades; solo tipos simples para evitar LazyInitializationException y recursión.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProveedorListDTO {
    private Long id;
    private String nombreComercial;
    private String cif;
    private String tipo;
    private List<String> listaOficios;
    private String telefono;
    private String email;
    private int contactosCount;
}
