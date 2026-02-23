package com.ingenieria.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "PRESUPUESTOS_PREVENTIVOS")
public class PresupuestoPreventivo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_presupuesto_prev")
    private Long idPresupuestoPrev;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vivienda_id", nullable = false)
    private Local vivienda;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "presupuesto_id")
    private Presupuesto presupuesto;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(length = 255)
    private String estado;

    @Column(columnDefinition = "TEXT")
    private String notas;

    @OneToMany(mappedBy = "presupuesto", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orden ASC")
    private List<PresupuestoPreventivoTarea> tareas = new ArrayList<>();
}
