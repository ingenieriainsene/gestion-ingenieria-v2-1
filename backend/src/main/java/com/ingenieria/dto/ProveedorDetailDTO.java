package com.ingenieria.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProveedorDetailDTO {
    private Long id;
    private String nombreComercial;
    private String razonSocial;
    private String cif;
    private Boolean esAutonomo;
    private String direccionFiscal;
    private LocalDateTime fechaAlta;
    private List<OficioDTO> listaOficios;
    private List<ContactoDTO> listaContactos;
}
