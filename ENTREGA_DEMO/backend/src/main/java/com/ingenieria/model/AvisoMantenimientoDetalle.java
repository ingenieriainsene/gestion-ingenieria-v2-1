package com.ingenieria.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "AVISOS_MANTENIMIENTO_DETALLE")
public class AvisoMantenimientoDetalle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_aviso_det")
    private Long idAvisoDet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aviso_id", nullable = false)
    @JsonIgnore
    private AvisoMantenimiento aviso;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tarea_contrato_id", nullable = false)
    @JsonIgnore
    private ContratoMantenimientoTarea tarea;

    @Column(length = 30)
    private String estado;

    @Column(columnDefinition = "TEXT")
    private String observaciones;
}
