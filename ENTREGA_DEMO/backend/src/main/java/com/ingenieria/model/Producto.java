package com.ingenieria.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Entity
@Table(name = "PRODUCTOS")
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_producto")
    private Long id;

    @Column(name = "cod_ref_producto", nullable = false, unique = true, length = 50)
    private String codRef;

    @Column(nullable = false, length = 255)
    private String descripcion;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal coste;

    @Column(length = 100)
    private String categoria;
}
