package com.ingenieria.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
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
@ToString(exclude = { "contrato", "instaladores" })
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "TRAMITES_CONTRATO")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
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

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "tramite_instaladores",
        joinColumns = @JoinColumn(name = "id_tramite"),
        inverseJoinColumns = @JoinColumn(name = "id_tecnico_instalador")
    )
    private Set<TecnicoInstalador> instaladores = new HashSet<>();

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
    private String descripcion;

    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_ejecucion")
    private LocalDateTime fechaEjecucion;

    @PrePersist
    protected void onCreate() {
        if (fechaCreacion == null)
            fechaCreacion = LocalDateTime.now();
        if (estado == null || estado.trim().isEmpty()) {
            estado = "Pendiente";
        }
    }

    // El concepto de "Venta Pendiente" se gestiona ahora a través del estado:
    // estado = "Pendiente" -> Venta Pendiente
    // estado = "En proceso" / "Terminado" -> Intervención Activa/Finalizada
}
