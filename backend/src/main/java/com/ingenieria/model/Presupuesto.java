package com.ingenieria.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.hibernate.annotations.BatchSize;

import java.math.BigDecimal;
import java.time.LocalDate;
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
@ToString(exclude = { "lineas", "cliente", "vivienda", "tramite" })
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "PRESUPUESTOS")
public class Presupuesto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_presupuesto")
    @EqualsAndHashCode.Include
    private Long idPresupuesto;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id", nullable = false)
    @JsonIgnoreProperties({ "locales", "presupuestos", "seguimientos", "contratos" })
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vivienda_id", nullable = false)
    @JsonIgnoreProperties({ "areas", "areasFuncionales", "cliente" })
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
