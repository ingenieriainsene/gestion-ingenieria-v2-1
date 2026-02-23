package com.ingenieria.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "SEGUIMIENTO_TRAMITES")
public class Seguimiento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_seguimiento")
    private Long idSeguimiento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tramite", nullable = false)
    @JsonIgnore
    private Tramite tramite;

    /** Técnico asignado. No serializar (LAZY); usar DTO. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    @JsonIgnore
    private Usuario usuarioAsignado;

    /** Creador del hito. No serializar (LAZY); usar DTO. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_creador", nullable = false)
    @JsonIgnore
    private Usuario creador;

    /** Proveedor (subcontrata). No serializar (LAZY); usar DTO. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_proveedor")
    @JsonIgnore
    private Proveedor proveedor;

    @Column(columnDefinition = "TEXT")
    private String comentario;

    @Column(name = "fecha_registro", insertable = false, updatable = false)
    private LocalDateTime fechaRegistro;

    @Column(name = "fecha_seguimiento")
    private LocalDate fechaSeguimiento; // Planned date

    @Column(name = "es_urgente")
    private Boolean esUrgente;

    @Column(length = 255)
    private String estado;

    @PrePersist
    public void onCreate() {
        if (fechaRegistro == null)
            fechaRegistro = LocalDateTime.now();
    }
}
