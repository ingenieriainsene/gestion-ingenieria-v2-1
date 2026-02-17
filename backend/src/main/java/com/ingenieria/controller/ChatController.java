package com.ingenieria.controller;

import com.ingenieria.dto.ChatLecturaRequest;
import com.ingenieria.dto.ChatMessageDTO;
import com.ingenieria.dto.ChatSalaDTO;
import com.ingenieria.dto.ChatSendRequest;
import com.ingenieria.dto.ChatUploadResponse;
import com.ingenieria.model.ChatSala;
import com.ingenieria.service.ChatService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

/**
 * Controlador REST y WebSocket para el sistema de chat en tiempo real.
 * 
 * Endpoints REST:
 * - GET /api/chat/mis-chats - Obtener salas de chat del usuario
 * - POST /api/chat/iniciar-privado - Iniciar chat privado
 * - GET /api/chat/sala-general - Obtener sala general
 * - GET /api/chat/mensajes - Obtener mensajes de una sala
 * - POST /api/chat/lecturas - Marcar mensaje como leído
 * - POST /api/chat/adjuntos - Subir archivo
 * 
 * Endpoints WebSocket (STOMP):
 * - /app/chat.send - Enviar mensaje (público o privado)
 * - /app/chat.typing - Notificar que está escribiendo
 * - /topic/chat.general - Suscripción a mensajes públicos
 * - /user/queue/chat.private - Suscripción a mensajes privados
 */
@Slf4j
@RestController
@RequestMapping("/api/chat")
public class ChatController {
    private final ChatService service;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(ChatService service, SimpMessagingTemplate messagingTemplate) {
        this.service = service;
        this.messagingTemplate = messagingTemplate;
    }

    // ========== REST ENDPOINTS ==========

    @GetMapping("/mis-chats")
    public List<ChatSalaDTO> getMisChats(@RequestParam Long usuarioId) {
        return service.getMisChats(usuarioId);
    }

    @PostMapping("/iniciar-privado")
    public ChatSala iniciarPrivado(@RequestParam Long usuario1Id, @RequestParam Long usuario2Id) {
        return service.iniciarChatPrivado(usuario1Id, usuario2Id);
    }

    @GetMapping("/sala-general")
    public ChatSala getSalaGeneral() {
        return service.getSalaGlobal();
    }

    @GetMapping("/mensajes")
    public List<ChatMessageDTO> getMensajes(@RequestParam Long salaId) {
        return service.getUltimosMensajes(salaId);
    }

    @PostMapping("/lecturas")
    public ResponseEntity<?> marcarLeido(@RequestBody ChatLecturaRequest req) {
        try {
            service.marcarLeido(req.getMensajeId(), req.getUsuarioId());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/adjuntos")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) {
        try {
            ChatUploadResponse res = new ChatUploadResponse();
            res.setUrl("uploads/" + file.getOriginalFilename());
            res.setNombre(file.getOriginalFilename());
            res.setTipo(file.getContentType());
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("No se pudo subir el archivo: " + e.getMessage());
        }
    }

    // ========== WEBSOCKET ENDPOINTS (STOMP) ==========

    /**
     * Enviar mensaje de chat (público o privado).
     * 
     * Si el mensaje es para una sala global, se envía a /topic/chat.general
     * Si es para una sala privada, se envía a
     * /user/{destinatario}/queue/chat.private
     */
    @MessageMapping("/chat.send")
    public void send(@Payload ChatSendRequest req, Principal principal) {
        log.info("[WebSocket] Mensaje recibido de {}: {}", principal.getName(), req.getContenido());

        try {
            // Guardar mensaje en base de datos
            ChatMessageDTO mensaje = service.guardarMensaje(req);

            // Determinar si es mensaje público o privado
            ChatSala sala = service.getSalaGlobal();
            if (req.getSalaId().equals(sala.getIdSala())) {
                // Mensaje público: broadcast a todos los suscritos a /topic/chat.general
                messagingTemplate.convertAndSend("/topic/chat.general", mensaje);
                log.info("[WebSocket] Mensaje público enviado a /topic/chat.general");
            } else {
                // Mensaje privado: enviar solo al destinatario
                // Obtener el ID del otro participante de la sala
                Long destinatarioId = service.getOtroParticipante(req.getSalaId(), req.getUsuarioId());
                if (destinatarioId != null) {
                    messagingTemplate.convertAndSendToUser(
                            destinatarioId.toString(),
                            "/queue/chat.private",
                            mensaje);
                    log.info("[WebSocket] Mensaje privado enviado a usuario {}", destinatarioId);
                }

                // También enviar al remitente para actualizar su UI
                messagingTemplate.convertAndSendToUser(
                        req.getUsuarioId().toString(),
                        "/queue/chat.private",
                        mensaje);
            }
        } catch (Exception e) {
            log.error("[WebSocket] Error al procesar mensaje: {}", e.getMessage(), e);
        }
    }

    /**
     * Notificar que un usuario está escribiendo.
     * Se envía a la sala correspondiente para que otros usuarios vean el indicador.
     */
    @MessageMapping("/chat.typing")
    public void typing(@Payload ChatSendRequest req) {
        log.info("[WebSocket] Usuario {} está escribiendo en sala {}", req.getUsuarioId(), req.getSalaId());

        try {
            ChatSala sala = service.getSalaGlobal();
            if (req.getSalaId().equals(sala.getIdSala())) {
                // Notificación pública
                messagingTemplate.convertAndSend("/topic/chat.typing", req);
            } else {
                // Notificación privada
                Long destinatarioId = service.getOtroParticipante(req.getSalaId(), req.getUsuarioId());
                if (destinatarioId != null) {
                    messagingTemplate.convertAndSendToUser(
                            destinatarioId.toString(),
                            "/queue/chat.typing",
                            req);
                }
            }
        } catch (Exception e) {
            log.error("[WebSocket] Error al procesar typing: {}", e.getMessage());
        }
    }
}
