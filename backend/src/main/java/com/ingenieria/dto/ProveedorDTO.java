package com.ingenieria.dto;

import lombok.Data;
import java.util.List;

@Data
public class ProveedorDTO {
    private Long idProveedor;
    private String nombreComercial;
    private String razonSocial;
    private String cif;
    private String direccionFiscal;
    private Boolean esAutonomo;
    private List<String> oficios;
    private List<ContactoDTO> contactos;
}
