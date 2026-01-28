package com.ingenieria.dto;

import lombok.Data;

@Data
public class ContactoDTO {
    private Long id;
    private String nombre;
    private String cargo;
    private String telefono;
    private String email;
}
