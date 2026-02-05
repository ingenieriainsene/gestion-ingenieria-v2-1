package com.ingenieria.service;

import com.ingenieria.dto.ChatAdjuntoDTO;
import com.ingenieria.dto.ChatMessageDTO;
import com.ingenieria.dto.ChatSendRequest;
import com.ingenieria.model.*;
import com.ingenieria.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ChatService {
    private final ChatSalaRepository salaRepo;
    private final ChatMensajeRepository mensajeRepo;
    private final ChatAdjuntoRepository adjuntoRepo;
    private final ChatMencionRepository mencionRepo;
    private final ChatLecturaRepository lecturaRepo;
    private final UsuarioRepository usuarioRepo;

    public ChatService(ChatSalaRepository salaRepo,
                       ChatMensajeRepository mensajeRepo,
                       ChatAdjuntoRepository adjuntoRepo,
                       ChatMencionRepository mencionRepo,
                       ChatLecturaRepository lecturaRepo,
                       UsuarioRepository usuarioRepo) {
        this.salaRepo = salaRepo;
        this.mensajeRepo = mensajeRepo;
        this.adjuntoRepo = adjuntoRepo;
        this.mencionRepo = mencionRepo;
        this.lecturaRepo = lecturaRepo;
        this.usuarioRepo = usuarioRepo;
    }

    @Transactional(readOnly = true)
    public ChatSala getSalaGlobal() {
        return salaRepo.findByEsGlobalTrue().orElseThrow(() -> new IllegalArgumentException("Sala global no encontrada"));
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDTO> getUltimosMensajes(Long salaId) {
        return mensajeRepo.findTop100BySala_IdSalaOrderByFechaEnvioDesc(salaId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ChatMessageDTO guardarMensaje(ChatSendRequest req) {
        if (req.getSalaId() == null || req.getUsuarioId() == null) {
            throw new IllegalArgumentException("salaId y usuarioId son obligatorios");
        }
        if (req.getContenido() == null || req.getContenido().isBlank()) {
            throw new IllegalArgumentException("El contenido es obligatorio");
        }
        ChatSala sala = salaRepo.findById(req.getSalaId())
                .orElseThrow(() -> new IllegalArgumentException("Sala no válida"));
        Usuario usuario = usuarioRepo.findById(req.getUsuarioId())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no válido"));

        ChatMensaje m = new ChatMensaje();
        m.setSala(sala);
        m.setUsuario(usuario);
        m.setContenido(req.getContenido().trim());
        ChatMensaje saved = mensajeRepo.save(m);

        if (req.getAdjuntos() != null) {
            for (ChatAdjuntoDTO a : req.getAdjuntos()) {
                ChatAdjunto adj = new ChatAdjunto();
                adj.setMensaje(saved);
                adj.setUrl(a.getUrl());
                adj.setTipo(a.getTipo());
                adj.setNombre(a.getNombre());
                adjuntoRepo.save(adj);
            }
        }
        if (req.getMenciones() != null) {
            for (Long uid : req.getMenciones()) {
                if (uid == null) continue;
                Usuario u = usuarioRepo.findById(uid).orElse(null);
                if (u == null) continue;
                ChatMencion men = new ChatMencion();
                men.setMensaje(saved);
                men.setUsuario(u);
                mencionRepo.save(men);
            }
        }
        return toDto(saved);
    }

    @Transactional
    public void marcarLeido(Long mensajeId, Long usuarioId) {
        Optional<ChatLectura> existing = lecturaRepo.findByMensaje_IdMensajeAndUsuario_IdUsuario(mensajeId, usuarioId);
        if (existing.isPresent()) return;
        ChatMensaje m = mensajeRepo.findById(mensajeId)
                .orElseThrow(() -> new IllegalArgumentException("Mensaje no encontrado"));
        Usuario u = usuarioRepo.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no válido"));
        ChatLectura lectura = new ChatLectura();
        lectura.setMensaje(m);
        lectura.setUsuario(u);
        lectura.setLeido(true);
        lecturaRepo.save(lectura);
    }

    private ChatMessageDTO toDto(ChatMensaje m) {
        ChatMessageDTO dto = new ChatMessageDTO();
        dto.setIdMensaje(m.getIdMensaje());
        dto.setSalaId(m.getSala() != null ? m.getSala().getIdSala() : null);
        dto.setUsuarioId(m.getUsuario() != null ? m.getUsuario().getIdUsuario() : null);
        dto.setUsuarioNombre(m.getUsuario() != null ? m.getUsuario().getNombreUsuario() : null);
        dto.setContenido(m.getContenido());
        dto.setFechaEnvio(m.getFechaEnvio());
        List<ChatAdjunto> adj = adjuntoRepo.findByMensaje_IdMensaje(m.getIdMensaje());
        List<ChatAdjuntoDTO> adjDtos = new ArrayList<>();
        for (ChatAdjunto a : adj) {
            ChatAdjuntoDTO adto = new ChatAdjuntoDTO();
            adto.setIdAdjunto(a.getIdAdjunto());
            adto.setUrl(a.getUrl());
            adto.setTipo(a.getTipo());
            adto.setNombre(a.getNombre());
            adjDtos.add(adto);
        }
        dto.setAdjuntos(adjDtos);
        return dto;
    }
}
