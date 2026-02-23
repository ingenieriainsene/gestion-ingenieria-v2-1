package com.ingenieria.model;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonBackReference;
import java.util.HashSet;
import java.util.Set;

@Data
@Entity
@Table(name = "AREAS_FUNCIONALES")
public class AreaFuncional {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_area")
    private Long idArea;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_local", nullable = false)
    @JsonBackReference
    private Local local;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(length = 255)
    private String descripcion;

    private Integer orden;

    @OneToMany(mappedBy = "areaFuncional", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @org.hibernate.annotations.BatchSize(size = 50)
    private Set<AreaFuncionalLinea> lineas = new HashSet<>();
}
