package com.ingenieria.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "CONTRATOS")
public class Contrato {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_contrato")
    private Long idContrato;

    // EAGER para evitar problemas de LazyInitialization al serializar a JSON
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_cliente", nullable = false)
    private Cliente cliente;

    // EAGER para evitar problemas de LazyInitialization al serializar a JSON
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_local", nullable = false)
    private Local local;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_vencimiento", nullable = false)
    private LocalDate fechaVencimiento;

    @Column(name = "tipo_contrato", nullable = false)
    private String tipoContrato; 

    @Column(name = "ce_previo")
    private String cePrevio; // Enum in DB

    @Column(name = "ce_post")
    private String cePost; // Enum in DB

    @Column(name = "enviado_cee_post")
    private Boolean enviadoCeePost;

    @Column(name = "licencia_obras")
    private String licenciaObras;

    private Boolean mtd;
    private Boolean planos;

    @Column(name = "subvencion_estado")
    private String subvencionEstado;

    @Column(name = "libro_edif_incluido")
    private Boolean libroEdifIncluido;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "fecha_alta", updatable = false)
    private LocalDateTime fechaAlta;

    @Column(name = "creado_por")
    private String creadoPor;

    @Column(name = "modificado_por")
    private String modificadoPor;

    @Column(name = "fecha_modificacion", insertable = false, updatable = false)
    private LocalDateTime fechaModificacion;

    @PrePersist
    protected void onCreate() {
        if (fechaAlta == null) fechaAlta = LocalDateTime.now();
    }
}
