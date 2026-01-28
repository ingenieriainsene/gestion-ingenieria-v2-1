package com.ingenieria.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "ARCHIVOS_CLIENTE")
public class ArchivoCliente {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_archivo")
    private Long idArchivo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cliente", nullable = false)
    private Cliente cliente;

    @Column(name = "nombre_visible", nullable = false)
    private String nombreVisible;

    @Column(name = "nombre_fisico", nullable = false)
    private String nombreFisico;

    @Column(name = "tipo_archivo")
    private String tipoArchivo;

    private String categoria; // Enum in DB

    @Column(name = "fecha_subida", insertable = false, updatable = false)
    private LocalDateTime fechaSubida;

    @Column(name = "usuario_subida")
    private String usuarioSubida;

    @PrePersist
    protected void onCreate() {
        if (fechaSubida == null) fechaSubida = LocalDateTime.now();
    }
}
