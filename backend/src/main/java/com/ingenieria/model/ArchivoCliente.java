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
@ToString(exclude = "cliente")
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "ARCHIVOS_CLIENTE")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class ArchivoCliente {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_archivo")
    @EqualsAndHashCode.Include
    private Long idArchivo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cliente", nullable = false)
    @JsonIgnoreProperties("archivos")
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
        if (fechaSubida == null)
            fechaSubida = LocalDateTime.now();
    }
}
