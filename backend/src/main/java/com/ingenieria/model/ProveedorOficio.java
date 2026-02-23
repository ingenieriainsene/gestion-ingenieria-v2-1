package com.ingenieria.model;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Data
@Entity
@Table(name = "PROVEEDOR_OFICIOS")
public class ProveedorOficio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_oficio")
    private Long idOficio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_proveedor", nullable = false)
    @JsonIgnore
    private Proveedor proveedor;

    @Column(nullable = false, length = 100)
    private String oficio;
}
