package com.ingenieria.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ChatMessageDTO {
    private Long idMensaje;
    private Long salaId;
    private Long usuarioId;
    private String usuarioNombre;
    private String contenido;
    private LocalDateTime fechaEnvio;
    private List<ChatAdjuntoDTO> adjuntos;
    private List<Long> menciones;
}
