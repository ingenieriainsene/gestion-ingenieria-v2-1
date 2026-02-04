package com.ingenieria.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "CONTRATOS_MANTENIMIENTO_TAREAS")
public class ContratoMantenimientoTarea {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tarea_contrato")
    private Long idTareaContrato;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contrato_mant_id", nullable = false)
    @JsonIgnore
    private ContratoMantenimiento contrato;

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
