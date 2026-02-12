package com.ingenieria.model;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

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
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vivienda_id", nullable = false)
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

    @Column(length = 30)
    private String estado;

    @Column(name = "tipo_presupuesto", length = 20)
    private String tipoPresupuesto;

    @OneToMany(mappedBy = "presupuesto", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orden ASC")
    @JsonManagedReference("presupuesto-lineas")
    private List<PresupuestoLinea> lineas = new ArrayList<>();

}
