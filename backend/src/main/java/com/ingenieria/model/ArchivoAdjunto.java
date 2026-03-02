package com.ingenieria.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import org.hibernate.annotations.GenericGenerator;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "archivos_adjuntos")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class ArchivoAdjunto {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "id_archivo", columnDefinition = "uuid")
    @EqualsAndHashCode.Include
    private UUID idArchivo;

    @Column(name = "entidad_tipo", nullable = false, length = 50)
    private String entidadTipo;

    @Column(name = "entidad_id", nullable = false)
    private Long entidadId;

    @Column(name = "nombre_original", nullable = false, length = 255)
    private String nombreOriginal;

    @Column(name = "nombre_disco", nullable = false, length = 255)
    private String nombreDisco;

    @Column(name = "tipo_mime", length = 120)
    private String tipoMime;

    @Column(name = "tamano_bytes")
    private Long tamanoBytes;

    @Column(name = "fecha_creacion")
    private OffsetDateTime fechaCreacion = OffsetDateTime.now();
}
