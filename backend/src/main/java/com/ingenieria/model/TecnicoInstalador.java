package com.ingenieria.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;
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
@ToString
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "tecnicos_instaladores")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class TecnicoInstalador {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tecnico_instalador")
    @EqualsAndHashCode.Include
    private Long idTecnicoInstalador;

    @Column(nullable = false, unique = true, length = 100)
    private String nombre;

    @Column(length = 20)
    private String telefono;

    @Column(nullable = false)
    private Boolean activo = true;

    @Column(name = "fecha_alta", insertable = false, updatable = false)
    private LocalDateTime fechaAlta;

    @PrePersist
    public void prePersist() {
        if (this.activo == null) {
            this.activo = true;
        }
    }
}
