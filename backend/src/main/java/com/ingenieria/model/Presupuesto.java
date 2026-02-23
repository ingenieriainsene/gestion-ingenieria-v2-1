package com.ingenieria.model;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Data
@Entity
@Table(name = "PRESUPUESTOS")
public class Presupuesto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_presupuesto")
    private Long idPresupuesto;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id", nullable = false)
    @JsonIgnoreProperties("locales") // Cliente doesn't have presupuestos list yet, but locales can loop
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vivienda_id", nullable = false)
    @JsonIgnoreProperties({ "areas", "areasFuncionales" })
    private Local vivienda;

    @Column(name = "codigo_referencia", nullable = false, length = 50)
    private String codigoReferencia;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(precision = 12, scale = 2)
    private BigDecimal total;

    @Column(name = "total_sin_iva", precision = 12, scale = 2)
    private BigDecimal totalSinIva;

    @Column(name = "total_con_iva", precision = 12, scale = 2)
    private BigDecimal totalConIva;

    @Column(length = 255)
    private String estado;

    @Column(name = "tipo_presupuesto", length = 255)
    private String tipoPresupuesto;

    @OneToMany(mappedBy = "presupuesto", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orden ASC")
    @JsonManagedReference("presupuesto-lineas")
    @BatchSize(size = 50)
    private Set<PresupuestoLinea> lineas = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tramite")
    @JsonIgnore
    private Tramite tramite;

}
