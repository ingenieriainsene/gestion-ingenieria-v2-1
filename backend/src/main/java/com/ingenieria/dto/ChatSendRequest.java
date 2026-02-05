package com.ingenieria.dto;

import lombok.Data;

import java.util.List;

@Data
public class ChatSendRequest {
    private Long salaId;
    private Long usuarioId;
    private String contenido;
    private List<Long> menciones;
    private List<ChatAdjuntoDTO> adjuntos;
}
