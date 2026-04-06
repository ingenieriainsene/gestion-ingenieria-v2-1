package com.ingenieria.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.hibernate.annotations.BatchSize;
import java.math.BigDecimal;
import java.time.LocalDateTime;
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
@ToString(exclude = { "areas", "areasFuncionales", "cliente" })
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "LOCALES")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Local {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_local")
    @EqualsAndHashCode.Include
    private Long idLocal;

    // EAGER para evitar problemas de LazyInitialization al serializar a JSON
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_cliente", nullable = true)
    @JsonIgnoreProperties({ "locales", "presupuestos", "contratos", "seguimientos", "archivos", "citas" })
    private Cliente cliente;

    @OneToMany(mappedBy = "local", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("local-areas")
    @BatchSize(size = 50)
    private Set<LocalArea> areas = new HashSet<>();

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

    @Column(name = "referencia_catastral", nullable = false, length = 20, unique = true)
    private String referenciaCatastral;

    @Column(name = "direccion_completa", nullable = false, length = 255)
    private String direccionCompleta;

    @Column(name = "codigo_postal", length = 10)
    private String codigoPostal;

    @Column(length = 100)
    private String localidad;

    @Column(length = 100)
    private String provincia;

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
    @JsonManagedReference("local-areas-funcionales")
    @BatchSize(size = 50)
    private Set<AreaFuncional> areasFuncionales = new HashSet<>();

    @PreUpdate
    protected void onUpdate() {
        fechaModificacion = LocalDateTime.now();
    }
}
