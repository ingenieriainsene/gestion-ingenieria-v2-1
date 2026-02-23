package com.ingenieria.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "contrato")
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "TRAMITES_CONTRATO")
public class Tramite {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tramite")
    @EqualsAndHashCode.Include
    private Long idTramite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_contrato", nullable = false)
    @JsonIgnore
    private Contrato contrato;

    @Column(name = "tipo_tramite", nullable = false, length = 255)
    private String tipoTramite;

    @Column(name = "estado", length = 255)
    private String estado;

    @Column(name = "tecnico_asignado", length = 255)
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
