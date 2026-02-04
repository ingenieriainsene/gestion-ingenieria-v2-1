package com.ingenieria.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "PRESUPUESTOS_PREVENTIVOS_TAREAS")
public class PresupuestoPreventivoTarea {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tarea_prev")
    private Long idTareaPrev;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "presupuesto_prev_id", nullable = false)
    @JsonIgnore
    private PresupuestoPreventivo presupuesto;

    @Column(nullable = false, length = 255)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "frecuencia_meses", nullable = false)
    private Integer frecuenciaMeses;

    @Column(name = "orden")
    private Integer orden;

    private Boolean activo;
}
