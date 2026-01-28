package com.ingenieria.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "ARCHIVOS_TRAMITE")
public class ArchivoTramite {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_archivo_t")
    private Long idArchivoT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tramite", nullable = false)
    private Tramite tramite;

    @Column(name = "nombre_visible", nullable = false)
    private String nombreVisible;

    @Column(name = "nombre_fisico", nullable = false)
    private String nombreFisico;

    @Column(name = "tipo_archivo")
    private String tipoArchivo;

    @Column(name = "fecha_subida", insertable = false, updatable = false)
    private LocalDateTime fechaSubida;

    @Column(name = "usuario_subida")
    private String usuarioSubida;

    @PrePersist
    protected void onCreate() {
        if (fechaSubida == null) fechaSubida = LocalDateTime.now();
    }
}
