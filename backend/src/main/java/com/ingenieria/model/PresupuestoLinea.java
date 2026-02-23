package com.ingenieria.model;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "PRESUPUESTO_LINEAS")
public class PresupuestoLinea {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_linea")
    private Long idLinea;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "presupuesto_id", nullable = false)
    @JsonBackReference("presupuesto-lineas")
    private Presupuesto presupuesto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "padre_id")
    @JsonBackReference("linea-hijos")
    private PresupuestoLinea padre;

    @OneToMany(mappedBy = "padre", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("linea-hijos")
    private List<PresupuestoLinea> hijos = new ArrayList<>();

    private Integer orden;

    @Column(name = "producto_id")
    private Long productoId;

    @Column(name = "producto_texto")
    private String productoTexto;

    @Column(nullable = false, length = 255)
    private String concepto;

    @Column(name = "iva_porcentaje", precision = 5, scale = 2)
    private BigDecimal ivaPorcentaje;

    @Column(name = "coste_unitario", precision = 12, scale = 2)
    private BigDecimal costeUnitario;

    @Column(name = "factor_margen", precision = 6, scale = 2)
    private BigDecimal factorMargen;

    @Column(name = "total_coste", precision = 12, scale = 2)
    private BigDecimal totalCoste;

    @Column(name = "pvp_unitario", precision = 12, scale = 2)
    private BigDecimal pvpUnitario;

    @Column(name = "total_pvp", precision = 12, scale = 2)
    private BigDecimal totalPvp;

    @Column(name = "importe_iva", precision = 12, scale = 2)
    private BigDecimal importeIva;

    @Column(name = "total_final", precision = 12, scale = 2)
    private BigDecimal totalFinal;

    @Column(name = "tipo_jerarquia", length = 20, columnDefinition = "VARCHAR(20)")
    private String tipoJerarquia;

    @Column(name = "codigo_visual", length = 20)
    private String codigoVisual;

    @Column(precision = 12, scale = 2)
    private BigDecimal cantidad;

    @Column(name = "precio_unitario", precision = 12, scale = 2)
    private BigDecimal precioUnitario;

    @Column(name = "total_linea", precision = 12, scale = 2)
    private BigDecimal totalLinea;

    @Column(name = "num_visitas")
    private Integer numVisitas;
}
