package com.ingenieria.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "albaran")
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "albaranes_venta_lineas")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class AlbaranVentaLinea {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_linea")
    @EqualsAndHashCode.Include
    private Long idLinea;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "albaran_id", nullable = false)
    @JsonIgnore
    private AlbaranVenta albaran;

    @Column(nullable = false)
    private Integer orden;

    @Column(nullable = false, length = 255)
    private String concepto;

    @Column(precision = 12, scale = 2)
    private BigDecimal cantidad;

    @Column(name = "precio_unitario", precision = 12, scale = 2)
    private BigDecimal precioUnitario;

    @Column(name = "iva_porcentaje", precision = 5, scale = 2)
    private BigDecimal ivaPorcentaje;

    @Column(name = "total_linea", precision = 12, scale = 2)
    private BigDecimal totalLinea;

    @Column(name = "total_iva", precision = 12, scale = 2)
    private BigDecimal totalIva;

    @Column(name = "total_con_iva", precision = 12, scale = 2)
    private BigDecimal totalConIva;
}
