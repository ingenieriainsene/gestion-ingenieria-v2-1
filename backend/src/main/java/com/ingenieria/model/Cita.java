package com.ingenieria.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

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
@ToString(exclude = { "cliente", "usuario" })
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "CITAS")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Cita {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cita")
    @EqualsAndHashCode.Include
    private Long idCita;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id", nullable = false)
    @JsonIgnoreProperties({ "locales", "presupuestos", "contratos", "seguimientos", "archivos", "citas" })
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(length = 150, nullable = false)
    private String titulo;

    @Column(length = 255)
    private String estado;

    @Column(name = "enlace_remoto", columnDefinition = "TEXT")
    private String enlaceRemoto;

    @Column(columnDefinition = "TEXT")
    private String notas;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDateTime fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDateTime fechaFin;

    @Column(name = "recordatorio_min")
    private Integer recordatorioMin;

    @Column(name = "fecha_creacion", insertable = false, updatable = false)
    private LocalDateTime fechaCreacion;
}
