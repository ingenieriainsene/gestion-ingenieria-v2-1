package com.ingenieria.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "LOCALES")
public class Local {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_local")
    private Long idLocal;

    // EAGER para evitar problemas de LazyInitialization al serializar a JSON
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_cliente", nullable = false)
    private Cliente cliente;

    @Column(name = "nombre_titular", nullable = false)
    private String nombreTitular;

    @Column(name = "apellido1_titular", nullable = false)
    private String apellido1Titular;

    @Column(name = "apellido2_titular")
    private String apellido2Titular;

    @Column(name = "dni_titular")
    private String dniTitular;

    private String cups;

    @Column(name = "referencia_catastral")
    private String referenciaCatastral;

    @Column(name = "direccion_completa", nullable = false)
    private String direccionCompleta;

    private BigDecimal latitud;
    private BigDecimal longitud;

    @Column(name = "fecha_alta", insertable = false, updatable = false)
    private LocalDateTime fechaAlta;

    @Column(name = "creado_por")
    private String creadoPor;

    @PrePersist
    protected void onCreate() {
        if (fechaAlta == null) fechaAlta = LocalDateTime.now();
    }
}
