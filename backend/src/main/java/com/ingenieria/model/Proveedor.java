package com.ingenieria.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "PROVEEDORES")
public class Proveedor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_proveedor")
    private Long idProveedor;

    @Column(name = "nombre_comercial", nullable = false, length = 100)
    private String nombreComercial;

    @Column(name = "razon_social", length = 100)
    private String razonSocial;

    @Column(name = "es_autonomo")
    private Boolean esAutonomo;

    @Column(nullable = false, length = 20)
    private String cif;

    @Column(name = "direccion_fiscal", length = 255)
    private String direccionFiscal;

    @Column(name = "fecha_alta", insertable = false, updatable = false)
    private LocalDateTime fechaAlta;

    @Column(name = "creado_por", length = 100)
    private String creadoPor;

    @OneToMany(mappedBy = "proveedor", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonIgnore
    private List<ProveedorContacto> contactos;

    @OneToMany(mappedBy = "proveedor", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonIgnore
    private List<ProveedorOficio> oficios;

    @PrePersist
    protected void onCreate() {
        if (fechaAlta == null)
            fechaAlta = LocalDateTime.now();
    }
}
