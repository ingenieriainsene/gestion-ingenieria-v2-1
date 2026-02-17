package com.ingenieria.service;

import com.ingenieria.dto.ChatAdjuntoDTO;
import com.ingenieria.dto.ChatMessageDTO;
import com.ingenieria.dto.ChatSalaDTO;
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
    private final ChatParticipanteRepository participanteRepo;

    public ChatService(ChatSalaRepository salaRepo,
            ChatMensajeRepository mensajeRepo,
            ChatAdjuntoRepository adjuntoRepo,
            ChatMencionRepository mencionRepo,
            ChatLecturaRepository lecturaRepo,
            UsuarioRepository usuarioRepo,
            ChatParticipanteRepository participanteRepo) {
        this.salaRepo = salaRepo;
        this.mensajeRepo = mensajeRepo;
        this.adjuntoRepo = adjuntoRepo;
        this.mencionRepo = mencionRepo;
        this.lecturaRepo = lecturaRepo;
        this.usuarioRepo = usuarioRepo;
        this.participanteRepo = participanteRepo;
    }

    @Transactional
    public ChatSala getSalaGlobal() {
        return salaRepo.findByEsGlobalTrue().orElseGet(() -> {
            ChatSala sala = new ChatSala();
            sala.setNombre("Chat General");
            sala.setEsGlobal(true);
            sala.setTipo("GLOBAL");
            return salaRepo.save(sala);
        });
    }

    @Transactional
    public ChatSala iniciarChatPrivado(Long usuario1Id, Long usuario2Id) {
        // Buscar si ya existe una sala privada con estos dos participantes
        List<ChatParticipante> parts1 = participanteRepo.findByUsuario_IdUsuario(usuario1Id);
        for (ChatParticipante p1 : parts1) {
            ChatSala s = p1.getSala();
            if ("PRIVADO".equals(s.getTipo())) {
                List<ChatParticipante> salaParts = participanteRepo.findBySala_IdSala(s.getIdSala());
                if (salaParts.size() == 2) {
                    boolean hasUser2 = salaParts.stream()
                            .anyMatch(sp -> sp.getUsuario().getIdUsuario().equals(usuario2Id));
                    if (hasUser2) {
                        return s;
                    }
                }
            }
        }

        // Crear nueva sala privada
        Usuario u1 = usuarioRepo.findById(usuario1Id).orElseThrow();
        Usuario u2 = usuarioRepo.findById(usuario2Id).orElseThrow();

        ChatSala sala = new ChatSala();
        sala.setNombre("Chat Privado");
        sala.setEsGlobal(false);
        sala.setTipo("PRIVADO");
        sala = salaRepo.save(sala);

        ChatParticipante p1 = new ChatParticipante();
        p1.setSala(sala);
        p1.setUsuario(u1);
        participanteRepo.save(p1);

        ChatParticipante p2 = new ChatParticipante();
        p2.setSala(sala);
        p2.setUsuario(u2);
        participanteRepo.save(p2);

        return sala;
    }

    @Transactional(readOnly = true)
    public List<ChatSalaDTO> getMisChats(Long userId) {
        List<ChatSalaDTO> result = new ArrayList<>();

        // 1. Sala Global
        ChatSala global = getSalaGlobal();
        result.add(toSalaDto(global, userId));

        // 2. Salas Privadas
        List<ChatParticipante> parts = participanteRepo.findByUsuario_IdUsuario(userId);
        for (ChatParticipante p : parts) {
            ChatSala s = p.getSala();
            if ("PRIVADO".equals(s.getTipo())) {
                result.add(toSalaDto(s, userId));
            }
        }
        return result;
    }

    private ChatSalaDTO toSalaDto(ChatSala s, Long userId) {
        ChatSalaDTO dto = new ChatSalaDTO();
        dto.setIdSala(s.getIdSala());
        dto.setEsGlobal(s.getEsGlobal());

        if (Boolean.TRUE.equals(s.getEsGlobal())) {
            dto.setNombre(s.getNombre());
        } else {
            // Nombre del otro participante
            List<ChatParticipante> parts = participanteRepo.findBySala_IdSala(s.getIdSala());
            String otherName = parts.stream()
                    .filter(p -> !p.getUsuario().getIdUsuario().equals(userId))
                    .map(p -> p.getUsuario().getNombreUsuario())
                    .findFirst()
                    .orElse("Chat Privado");
            dto.setNombre(otherName);
        }
        return dto;
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
        return toDto(saved);
    }

    // ... (rest of methods: marcarLeido, etc. keep as is, just copy if needed or
    // assume existing if not modifying)

    @Transactional
    public void marcarLeido(Long mensajeId, Long usuarioId) {
        Optional<ChatLectura> existing = lecturaRepo.findByMensaje_IdMensajeAndUsuario_IdUsuario(mensajeId, usuarioId);
        if (existing.isPresent())
            return;

        ChatMensaje m = mensajeRepo.findById(mensajeId).orElseThrow();
        Usuario u = usuarioRepo.findById(usuarioId).orElseThrow();

        ChatLectura lectura = new ChatLectura();
        lectura.setMensaje(m);
        lectura.setUsuario(u);
        lectura.setLeido(true);
        lecturaRepo.save(lectura);
    }

    private ChatMessageDTO toDto(ChatMensaje m) {
        ChatMessageDTO dto = new ChatMessageDTO();
        dto.setIdMensaje(m.getIdMensaje());
        dto.setSalaId(m.getSala().getIdSala());
        dto.setUsuarioId(m.getUsuario().getIdUsuario());
        dto.setUsuarioNombre(m.getUsuario().getNombreUsuario());
        dto.setContenido(m.getContenido());
        dto.setFechaEnvio(m.getFechaEnvio());

        List<ChatAdjunto> adj = adjuntoRepo.findByMensaje_IdMensaje(m.getIdMensaje());
        List<ChatAdjuntoDTO> adjDtos = adj.stream().map(a -> {
            ChatAdjuntoDTO d = new ChatAdjuntoDTO();
            d.setIdAdjunto(a.getIdAdjunto());
            d.setUrl(a.getUrl());
            d.setTipo(a.getTipo());
            d.setNombre(a.getNombre());
            return d;
        }).collect(Collectors.toList());

        dto.setAdjuntos(adjDtos);
        return dto;
    }

    /**
     * Obtener el ID del otro participante en una sala privada.
     * Útil para enviar mensajes privados al destinatario correcto.
     */
    @Transactional(readOnly = true)
    public Long getOtroParticipante(Long salaId, Long usuarioId) {
        List<ChatParticipante> participantes = participanteRepo.findBySala_IdSala(salaId);
        return participantes.stream()
                .filter(p -> !p.getUsuario().getIdUsuario().equals(usuarioId))
                .map(p -> p.getUsuario().getIdUsuario())
                .findFirst()
                .orElse(null);
    }
}
