package com.ingenieria.model;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonBackReference;

import java.math.BigDecimal;

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
    @JsonBackReference
    private Presupuesto presupuesto;

    private Integer orden;

    @Column(name = "producto_id")
    private Long productoId;

    @Column(name = "producto_texto")
    private String productoTexto;

    @Column(nullable = false, length = 255)
    private String concepto;

    @Column(name = "iva_porcentaje", precision = 5, scale = 2)
    private BigDecimal ivaPorcentaje;

    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal cantidad;

    @Column(name = "precio_unitario", precision = 12, scale = 2, nullable = false)
    private BigDecimal precioUnitario;

    @Column(name = "total_linea", precision = 12, scale = 2, nullable = false)
    private BigDecimal totalLinea;
}
