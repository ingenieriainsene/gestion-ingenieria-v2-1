package com.ingenieria.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "PRESUPUESTOS")
public class Presupuesto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_presupuesto")
    private Long idPresupuesto;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vivienda_id", nullable = false)
    private Local vivienda;

    @Column(name = "codigo_referencia", nullable = false)
    private String codigoReferencia;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(precision = 12, scale = 2)
    private BigDecimal total;

    @Column(length = 30)
    private String estado;

    @OneToMany(mappedBy = "presupuesto", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orden ASC")
    private List<PresupuestoLinea> lineas = new ArrayList<>();
}
