package com.ingenieria.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "AVISOS_MANTENIMIENTO", uniqueConstraints = @UniqueConstraint(columnNames = { "contrato_mant_id",
        "fecha_programada" }))
public class AvisoMantenimiento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_aviso")
    private Long idAviso;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contrato_mant_id", nullable = false)
    @JsonIgnore
    private ContratoMantenimiento contrato;

    @Column(name = "fecha_programada", nullable = false)
    private LocalDate fechaProgramada;

    @Column(length = 255)
    private String estado;

    @Column(name = "fecha_creacion", insertable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @OneToMany(mappedBy = "aviso", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AvisoMantenimientoDetalle> detalles = new ArrayList<>();
}
