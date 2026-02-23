package com.ingenieria.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "CONTRATOS_MANTENIMIENTO")
public class ContratoMantenimiento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_contrato_mant")
    private Long idContratoMant;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "presupuesto_prev_id", nullable = false)
    private PresupuestoPreventivo presupuestoPreventivo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vivienda_id", nullable = false)
    private Local vivienda;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "contrato_id")
    private Contrato contrato;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(length = 255)
    private String estado;

    @Column(name = "creado_por", length = 100)
    private String creadoPor;

    @Column(name = "fecha_alta", insertable = false, updatable = false)
    private LocalDateTime fechaAlta;

    @OneToMany(mappedBy = "contrato", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orden ASC")
    private List<ContratoMantenimientoTarea> tareas = new ArrayList<>();
}
