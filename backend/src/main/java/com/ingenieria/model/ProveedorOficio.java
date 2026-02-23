package com.ingenieria.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "proveedor")
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "PROVEEDOR_OFICIOS")
public class ProveedorOficio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_oficio")
    @EqualsAndHashCode.Include
    private Long idOficio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_proveedor", nullable = false)
    @JsonIgnore
    private Proveedor proveedor;

    @Column(nullable = false, length = 100)
    private String oficio;
}
