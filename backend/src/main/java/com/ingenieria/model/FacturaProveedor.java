package com.ingenieria.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.FetchType;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = { "proveedor", "tramite" })
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "facturas_proveedor")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class FacturaProveedor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_factura")
    @EqualsAndHashCode.Include
    private Long idFactura;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_proveedor", nullable = false)
    @JsonIgnore
    private Proveedor proveedor;

    @Column(name = "numero_factura", nullable = false, length = 50)
    private String numeroFactura;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(precision = 12, scale = 2)
    private BigDecimal importe;

    @Column(length = 30)
    private String estado = "Pendiente";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tramite")
    @JsonIgnore
    private Tramite tramite;

    @Column(columnDefinition = "TEXT")
    private String notas;
}
