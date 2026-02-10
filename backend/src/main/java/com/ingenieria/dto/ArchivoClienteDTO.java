package com.ingenieria.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ArchivoClienteDTO {
    private Long idArchivo;
    private Long clienteId;
    private String nombreVisible;
    private String tipoArchivo;
    private String url;
    private LocalDateTime fechaSubida;
    private String usuarioSubida;
}
