package com.ingenieria.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "local_areas")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class LocalArea {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_area")
    private Long idArea;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_local", nullable = false)
    @JsonBackReference("local-areas")
    private Local local;

    @Column(nullable = false, length = 100)
    private String nombre;

    private Integer orden;

    @OneToMany(mappedBy = "area", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("area-ubicaciones")
    private List<LocalUbicacion> ubicaciones = new ArrayList<>();
}
