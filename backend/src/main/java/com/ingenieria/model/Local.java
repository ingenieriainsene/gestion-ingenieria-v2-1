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

    @Column(name = "nombre_titular", nullable = false, length = 50)
    private String nombreTitular;

    @Column(name = "apellido1_titular", nullable = false, length = 50)
    private String apellido1Titular;

    @Column(name = "apellido2_titular", length = 50)
    private String apellido2Titular;

    @Column(name = "dni_titular", length = 15)
    private String dniTitular;

    @Column(length = 22)
    private String cups;

    @Column(name = "referencia_catastral", length = 20)
    private String referenciaCatastral;

    @Column(name = "direccion_completa", nullable = false, length = 255)
    private String direccionCompleta;

    private BigDecimal latitud;
    private BigDecimal longitud;

    @Column(name = "fecha_alta", insertable = false, updatable = false)
    private LocalDateTime fechaAlta;

    @Column(name = "creado_por", length = 100)
    private String creadoPor;

    @Column(name = "modificado_por", length = 100)
    private String modificadoPor;

    @Column(name = "fecha_modificacion")
    private LocalDateTime fechaModificacion;

    @PrePersist
    protected void onCreate() {
        if (fechaAlta == null)
            fechaAlta = LocalDateTime.now();
        if (fechaModificacion == null)
            fechaModificacion = LocalDateTime.now();
    }

    @OneToMany(mappedBy = "local", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonManagedReference
    private java.util.List<AreaFuncional> areasFuncionales = new java.util.ArrayList<>();

    @PreUpdate
    protected void onUpdate() {
        fechaModificacion = LocalDateTime.now();
    }
}
