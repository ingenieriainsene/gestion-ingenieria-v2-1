package com.ingenieria.model;

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
    private Tramite tramite;

    // Técnico asignado
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuarioAsignado;

    // Creador del hito
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_creador", nullable = false)
    private Usuario creador;

    // Proveedor (Subcontrata)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_proveedor")
    private Proveedor proveedor;

    @Column(columnDefinition = "TEXT")
    private String comentario;

    @Column(name = "fecha_registro", insertable = false, updatable = false)
    private LocalDateTime fechaRegistro;

    @Column(name = "fecha_seguimiento")
    private LocalDate fechaSeguimiento; // Planned date

    @Column(name = "es_urgente")
    private Boolean esUrgente;

    private String estado;

    @PrePersist
    public void onCreate() {
        if (fechaRegistro == null)
            fechaRegistro = LocalDateTime.now();
    }
}
