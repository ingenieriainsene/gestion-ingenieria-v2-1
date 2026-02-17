package com.ingenieria.controller;

import com.ingenieria.model.ChatRoom;
import com.ingenieria.model.ChatUserRoom;
import com.ingenieria.model.ChatMessage;
import com.ingenieria.model.Usuario;
import com.ingenieria.repository.ChatRoomRepository;
import com.ingenieria.repository.ChatUserRoomRepository;
import com.ingenieria.repository.ChatMessageRepository;
import com.ingenieria.repository.UsuarioRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatUserRoomRepository chatUserRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UsuarioRepository usuarioRepository;

    public ChatController(ChatRoomRepository chatRoomRepository,
            ChatUserRoomRepository chatUserRoomRepository,
            ChatMessageRepository chatMessageRepository,
            UsuarioRepository usuarioRepository) {
        this.chatRoomRepository = chatRoomRepository;
        this.chatUserRoomRepository = chatUserRoomRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping("/rooms")
    public List<ChatRoom> getAllRooms() {
        return chatRoomRepository.findAll();
    }

    @PostMapping("/rooms")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> createRoom(@RequestBody ChatRoom chatRoom) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getName() == null) {
                return ResponseEntity.status(401).body("No autenticado");
            }
            String username = auth.getName();
            Usuario usuario = usuarioRepository.findByNombreUsuario(username).orElse(null);

            if (usuario != null) {
                // Identificador determinista para el creador
                UUID userUuid = UUID.nameUUIDFromBytes(username.getBytes());
                chatRoom.setCreatedBy(userUuid);

                // Guardar y flashear para obtener el ID generado inmediatamente
                ChatRoom savedRoom = chatRoomRepository.saveAndFlush(chatRoom);

                // Crear membresía automática
                ChatUserRoom.ChatUserRoomId membershipId = new ChatUserRoom.ChatUserRoomId(savedRoom.getId(), userUuid);
                chatUserRoomRepository.save(new ChatUserRoom(membershipId, java.time.LocalDateTime.now()));

                return ResponseEntity.ok(savedRoom);
            }
            return ResponseEntity.badRequest().body("Usuario local no encontrado");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error servidor: " + e.getMessage());
        }
    }

    @PostMapping("/messages")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> sendMessage(@RequestBody ChatMessage message) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getName() == null) {
                return ResponseEntity.status(401).body("No autenticado");
            }
            String username = auth.getName();

            // Validación de contenido profesional
            if (message.getContent() == null || message.getContent().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("El contenido del mensaje no puede estar vacío");
            }

            if (message.getSenderId() == null) {
                message.setSenderId(UUID.nameUUIDFromBytes(username.getBytes()));
            }

            message.setContent(message.getContent().trim());
            ChatMessage saved = chatMessageRepository.save(message);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error al enviar: " + e.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyChatId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null)
                return ResponseEntity.status(401).build();

            String username = auth.getName();
            java.util.Map<String, String> identity = new java.util.HashMap<>();
            identity.put("username", username);
            identity.put("chatId", UUID.nameUUIDFromBytes(username.getBytes()).toString());

            return ResponseEntity.ok(identity);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}
