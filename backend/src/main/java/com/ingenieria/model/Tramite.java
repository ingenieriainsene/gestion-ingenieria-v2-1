package com.ingenieria.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "TRAMITES_CONTRATO")
public class Tramite {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tramite")
    private Long idTramite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_contrato", nullable = false)
    @JsonIgnore
    private Contrato contrato;

    @Column(name = "tipo_tramite", nullable = false)
    private String tipoTramite;

    @Column(name = "estado", length = 50)
    private String estado;

    @Column(name = "tecnico_asignado")
    private String tecnicoAsignado; // Legacy field, might be replaced by relations but kept for DDL compliance

    @Column(name = "fecha_seguimiento")
    private LocalDate fechaSeguimiento;

    @Column(name = "es_urgente")
    private Boolean esUrgente;

    @Column(name = "facturado")
    private Boolean facturado = false;

    @Column(name = "detalle_seguimiento", columnDefinition = "TEXT")
    private String detalleSeguimiento;

    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_ejecucion")
    private LocalDateTime fechaEjecucion;

    @PrePersist
    protected void onCreate() {
        if (fechaCreacion == null)
            fechaCreacion = LocalDateTime.now();
    }

    // El concepto de "Venta Pendiente" se gestiona ahora a través del estado:
    // estado = "Pendiente" -> Venta Pendiente
    // estado = "En proceso" / "Terminado" -> Intervención Activa/Finalizada
}
