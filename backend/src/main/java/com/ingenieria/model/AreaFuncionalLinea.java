package com.ingenieria.model;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonBackReference;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "AREA_FUNCIONAL_LINEAS")
public class AreaFuncionalLinea {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_linea")
    private Long idLinea;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_area", nullable = false)
    @JsonBackReference
    private AreaFuncional areaFuncional;

    @Column(name = "producto_id")
    private Long productoId;

    @Column(name = "producto_texto")
    private String productoTexto;

    @Column(length = 255)
    private String concepto;

    @Column(precision = 12, scale = 2)
    private BigDecimal cantidad;

    @Column(name = "accion_requerida", length = 255)
    private String accionRequerida;

    private Integer orden;
}
