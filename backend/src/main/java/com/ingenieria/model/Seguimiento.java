package com.ingenieria.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
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
@ToString(exclude = { "tramite", "usuarioAsignado", "creador", "proveedor" })
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "SEGUIMIENTO_TRAMITES")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Seguimiento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_seguimiento")
    @EqualsAndHashCode.Include
    private Long idSeguimiento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tramite", nullable = false)
    @JsonIgnoreProperties({ "seguimientos", "contrato" })
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

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "seguimiento_instaladores", joinColumns = @JoinColumn(name = "id_seguimiento"), inverseJoinColumns = @JoinColumn(name = "id_tecnico_instalador"))
    private List<TecnicoInstalador> tecnicosInstaladores = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "seguimiento_tecnicos", joinColumns = @JoinColumn(name = "id_seguimiento"), inverseJoinColumns = @JoinColumn(name = "id_usuario"))
    private List<Usuario> usuariosAsignados = new ArrayList<>();

    @PrePersist
    public void onCreate() {
        if (fechaRegistro == null)
            fechaRegistro = LocalDateTime.now();
    }
}
