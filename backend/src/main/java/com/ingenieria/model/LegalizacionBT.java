package com.ingenieria.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "legalizaciones_bt")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class LegalizacionBT {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_legalizacion")
    private Long idLegalizacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_local", nullable = false, insertable = false, updatable = false)
    private Local local;

    @Column(name = "fecha_alta", insertable = false, updatable = false)
    private LocalDateTime fechaAlta;

    @Column(name = "id_local")
    private Long idLocal;

    @Column(name = "id_tramite")
    private Long idTramite;

    @Column(name = "fecha_legalizacion")
    private LocalDate fechaLegalizacion;

    @Column(name = "datos_json", columnDefinition = "TEXT")
    private String datosJson;

    @Column(name = "estado")
    private String estado;

    @PrePersist
    protected void onCreate() {
        if (this.fechaAlta == null) {
            this.fechaAlta = LocalDateTime.now();
        }
        if (this.estado == null) {
            this.estado = "Pendiente";
        }
    }
}
