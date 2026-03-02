package com.ingenieria.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArchivoAdjuntoDTO {
    private UUID idArchivo;
    private String entidadTipo;
    private Long entidadId;
    private String nombreOriginal;
    private String nombreDisco;
    private String tipoMime;
    private Long tamanoBytes;
    private OffsetDateTime fechaCreacion;
}
