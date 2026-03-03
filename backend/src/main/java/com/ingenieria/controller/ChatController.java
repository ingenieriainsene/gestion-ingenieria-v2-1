package com.ingenieria.controller;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.ingenieria.model.ChatPrivateRequest;
import com.ingenieria.model.ChatRoom;
import com.ingenieria.model.ChatUserRoom;
import com.ingenieria.model.ChatMessage;
import com.ingenieria.model.Usuario;
import com.ingenieria.repository.ChatPrivateRequestRepository;
import com.ingenieria.repository.ChatRoomRepository;
import com.ingenieria.repository.ChatUserRoomRepository;
import com.ingenieria.repository.ChatMessageRepository;
import com.ingenieria.repository.UsuarioRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final String ADMIN_ROLE = "ROLE_ADMIN";

    private final ChatRoomRepository chatRoomRepository;
    private final ChatUserRoomRepository chatUserRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatPrivateRequestRepository chatPrivateRequestRepository;
    private final UsuarioRepository usuarioRepository;

    public ChatController(ChatRoomRepository chatRoomRepository,
            ChatUserRoomRepository chatUserRoomRepository,
            ChatMessageRepository chatMessageRepository,
            ChatPrivateRequestRepository chatPrivateRequestRepository,
            UsuarioRepository usuarioRepository) {
        this.chatRoomRepository = chatRoomRepository;
        this.chatUserRoomRepository = chatUserRoomRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.chatPrivateRequestRepository = chatPrivateRequestRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping("/rooms")
    public ResponseEntity<?> getAllRooms() {
        try {
            String username = getAuthenticatedUsername();
            UUID userChatId = generarChatIdActual(username);

            List<ChatRoom> groups = chatRoomRepository.findByIsGroupTrueOrderByCreatedAtAsc();
            List<UUID> myRoomIds = chatUserRoomRepository.findById_UserId(userChatId).stream()
                    .map(r -> r.getId().getRoomId())
                    .toList();
            List<ChatRoom> mine = chatRoomRepository.findAllById(myRoomIds);

            Map<UUID, ChatRoom> merged = new HashMap<>();
            for (ChatRoom room : groups) {
                merged.put(room.getId(), room);
            }
            for (ChatRoom room : mine) {
                merged.put(room.getId(), room);
            }
            List<ChatRoom> result = merged.values().stream()
                    .sorted(java.util.Comparator.comparing(ChatRoom::getCreatedAt))
                    .toList();
            Map<UUID, String> senderNames = construirMapaRemitentes();
            List<ChatRoomView> response = result.stream()
                    .map(r -> toRoomView(r, senderNames))
                    .toList();
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error servidor: " + e.getMessage());
        }
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<?> getMessagesByRoom(@PathVariable UUID roomId) {
        try {
            String username = getAuthenticatedUsername();
            UUID userChatId = generarChatIdActual(username);
            if (!chatRoomRepository.existsById(roomId)) {
                return ResponseEntity.badRequest().body("Sala no encontrada");
            }
            ChatRoom room = chatRoomRepository.findById(roomId).orElse(null);
            if (room == null) {
                return ResponseEntity.badRequest().body("Sala no encontrada");
            }
            if (!Boolean.TRUE.equals(room.getIsGroup())
                    && !chatUserRoomRepository.existsById_RoomIdAndId_UserId(roomId, userChatId)) {
                return ResponseEntity.status(403).body("No tienes acceso a esta sala privada.");
            }
            List<ChatMessage> mensajes = chatMessageRepository.findTop200ByRoomIdOrderByCreatedAtAsc(roomId);
            Map<UUID, String> senderNames = construirMapaRemitentes();
            List<ChatMessageView> response = mensajes.stream()
                    .map(m -> toView(m, senderNames))
                    .toList();
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error servidor: " + e.getMessage());
        }
    }

    @PostMapping("/rooms")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> createRoom(@RequestBody ChatRoom chatRoom) {
        try {
            String username = getAuthenticatedUsername();
            if (chatRoom.getName() == null || chatRoom.getName().isBlank()) {
                return ResponseEntity.badRequest().body("El nombre de la sala es obligatorio.");
            }
            if (!Boolean.TRUE.equals(chatRoom.getIsGroup())) {
                return ResponseEntity.badRequest().body("Los chats privados se crean por solicitud y aceptación.");
            }

            UUID userUuid = generarChatIdActual(username);
            chatRoom.setCreatedBy(userUuid);
            ChatRoom savedRoom = chatRoomRepository.saveAndFlush(chatRoom);

            ChatUserRoom.ChatUserRoomId membershipId = new ChatUserRoom.ChatUserRoomId(savedRoom.getId(), userUuid);
            chatUserRoomRepository.save(new ChatUserRoom(membershipId, LocalDateTime.now()));

            return ResponseEntity.ok(savedRoom);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error servidor: " + e.getMessage());
        }
    }

    @PostMapping("/messages")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> sendMessage(@RequestBody ChatMessage message) {
        try {
            String username = getAuthenticatedUsername();
            if (message.getRoomId() == null) {
                return ResponseEntity.badRequest().body("room_id es obligatorio.");
            }
            ChatRoom room = chatRoomRepository.findById(message.getRoomId()).orElse(null);
            if (room == null) {
                return ResponseEntity.badRequest().body("Sala no encontrada.");
            }
            UUID senderChatId = generarChatIdActual(username);
            if (!Boolean.TRUE.equals(room.getIsGroup())
                    && !chatUserRoomRepository.existsById_RoomIdAndId_UserId(room.getId(), senderChatId)) {
                return ResponseEntity.status(403).body("No tienes acceso a esta sala privada.");
            }
            if (message.getContent() == null || message.getContent().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("El contenido del mensaje no puede estar vacío");
            }

            message.setSenderId(senderChatId);

            message.setContent(message.getContent().trim());
            ChatMessage saved = chatMessageRepository.save(message);
            Map<UUID, String> senderNames = construirMapaRemitentes();
            return ResponseEntity.ok(toView(saved, senderNames));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error al enviar: " + e.getMessage());
        }
    }

    @DeleteMapping("/rooms/{roomId}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> deleteGroup(@PathVariable UUID roomId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getName() == null) {
                return ResponseEntity.status(401).body("No autenticado");
            }
            boolean isAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> ADMIN_ROLE.equalsIgnoreCase(a.getAuthority()));
            if (!isAdmin) {
                return ResponseEntity.status(403).body("Solo los administradores pueden eliminar grupos.");
            }

            ChatRoom room = chatRoomRepository.findById(roomId).orElse(null);
            if (room == null) {
                return ResponseEntity.badRequest().body("Sala no encontrada.");
            }
            if (!Boolean.TRUE.equals(room.getIsGroup())) {
                return ResponseEntity.badRequest().body("Solo se pueden eliminar salas de grupo.");
            }

            chatRoomRepository.delete(room);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al eliminar grupo: " + e.getMessage());
        }
    }

    @GetMapping("/users")
    public ResponseEntity<?> getChatUsers() {
        try {
            String username = getAuthenticatedUsername();
            List<Usuario> usuarios = usuarioRepository.findAll().stream()
                    .filter(u -> u.getNombreUsuario() != null && !u.getNombreUsuario().isBlank())
                    .filter(u -> !u.getNombreUsuario().equals(username))
                    .sorted(java.util.Comparator.comparing(Usuario::getNombreUsuario))
                    .toList();

            List<ChatUserView> response = usuarios.stream()
                    .map(u -> new ChatUserView(
                            u.getIdUsuario(),
                            u.getNombreUsuario(),
                            generarChatIdActual(u.getNombreUsuario())))
                    .toList();
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error servidor: " + e.getMessage());
        }
    }

    @PostMapping("/private-requests")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> createPrivateRequest(@RequestBody PrivateRequestCreateRequest request) {
        try {
            String fromUsername = getAuthenticatedUsername();
            Usuario fromUser = usuarioRepository.findByNombreUsuario(fromUsername).orElse(null);
            if (fromUser == null) {
                return ResponseEntity.badRequest().body("Usuario emisor no encontrado.");
            }
            if (request == null || request.toUserId() == null) {
                return ResponseEntity.badRequest().body("toUserId es obligatorio.");
            }
            if (fromUser.getIdUsuario().equals(request.toUserId())) {
                return ResponseEntity.badRequest().body("No puedes solicitar un chat privado contigo mismo.");
            }

            Usuario toUser = usuarioRepository.findById(request.toUserId()).orElse(null);
            if (toUser == null || toUser.getNombreUsuario() == null || toUser.getNombreUsuario().isBlank()) {
                return ResponseEntity.badRequest().body("Usuario destino no encontrado.");
            }

            UUID fromChatId = generarChatIdActual(fromUser.getNombreUsuario());
            UUID toChatId = generarChatIdActual(toUser.getNombreUsuario());

            ChatRoom existing = findExistingPrivateRoomBetween(fromChatId, toChatId);
            if (existing != null) {
                return ResponseEntity.badRequest().body("Ya existe un chat privado con este usuario.");
            }
            if (chatPrivateRequestRepository.existsPendingBetween(fromChatId, toChatId)) {
                return ResponseEntity.badRequest().body("Ya existe una solicitud pendiente entre ambos usuarios.");
            }

            ChatPrivateRequest req = new ChatPrivateRequest();
            req.setFromUserId(fromChatId);
            req.setToUserId(toChatId);
            req.setStatus(ChatPrivateRequest.Status.PENDING);
            req.setCreatedAt(LocalDateTime.now());
            ChatPrivateRequest saved = chatPrivateRequestRepository.save(req);

            return ResponseEntity.ok(toPrivateRequestView(saved, fromUser.getNombreUsuario(), toUser.getNombreUsuario()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("No se pudo crear la solicitud: " + e.getMessage());
        }
    }

    @GetMapping("/private-requests/incoming")
    public ResponseEntity<?> getIncomingPrivateRequests() {
        try {
            String username = getAuthenticatedUsername();
            UUID myChatId = generarChatIdActual(username);
            Map<UUID, String> senderMap = construirMapaRemitentes();
            List<ChatPrivateRequest> pending = chatPrivateRequestRepository
                    .findByToUserIdAndStatusOrderByCreatedAtDesc(myChatId, ChatPrivateRequest.Status.PENDING);

            List<PrivateRequestView> response = pending.stream()
                    .map(r -> toPrivateRequestView(
                            r,
                            senderMap.getOrDefault(r.getFromUserId(), "Usuario"),
                            username))
                    .toList();
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error servidor: " + e.getMessage());
        }
    }

    @PostMapping("/private-requests/{id}/accept")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> acceptPrivateRequest(@PathVariable Long id) {
        return responderPrivateRequest(id, true);
    }

    @PostMapping("/private-requests/{id}/reject")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> rejectPrivateRequest(@PathVariable Long id) {
        return responderPrivateRequest(id, false);
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
            identity.put("chatId", generarChatIdActual(username).toString());

            return ResponseEntity.ok(identity);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    private ResponseEntity<?> responderPrivateRequest(Long id, boolean accept) {
        try {
            String username = getAuthenticatedUsername();
            UUID myChatId = generarChatIdActual(username);
            ChatPrivateRequest req = chatPrivateRequestRepository.findById(id).orElse(null);
            if (req == null) {
                return ResponseEntity.badRequest().body("Solicitud no encontrada.");
            }
            if (!myChatId.equals(req.getToUserId())) {
                return ResponseEntity.status(403).body("No puedes responder esta solicitud.");
            }
            if (req.getStatus() != ChatPrivateRequest.Status.PENDING) {
                return ResponseEntity.badRequest().body("La solicitud ya fue procesada.");
            }

            if (!accept) {
                req.setStatus(ChatPrivateRequest.Status.REJECTED);
                req.setRespondedAt(LocalDateTime.now());
                chatPrivateRequestRepository.save(req);
                return ResponseEntity.ok("Solicitud rechazada.");
            }

            ChatRoom room = findExistingPrivateRoomBetween(req.getFromUserId(), req.getToUserId());
            Map<UUID, String> senderNames = construirMapaRemitentes();
            String fromName = senderNames.getOrDefault(
                    req.getFromUserId(),
                    req.getFromUserId() != null ? req.getFromUserId().toString().substring(0, 8) : "Usuario");
            String toName = senderNames.getOrDefault(
                    req.getToUserId(),
                    req.getToUserId() != null ? req.getToUserId().toString().substring(0, 8) : "Usuario");
            String desiredRoomName = buildPrivateRoomName(fromName, toName);

            if (room == null) {
                room = new ChatRoom();
                room.setName(desiredRoomName);
                room.setIsGroup(false);
                room.setCreatedBy(req.getFromUserId());
                room = chatRoomRepository.save(room);
            } else if (room.getName() == null || !room.getName().equals(desiredRoomName)) {
                room.setName(desiredRoomName);
                room = chatRoomRepository.save(room);
            }
            createMembershipIfMissing(room.getId(), req.getFromUserId());
            createMembershipIfMissing(room.getId(), req.getToUserId());

            req.setStatus(ChatPrivateRequest.Status.ACCEPTED);
            req.setRespondedAt(LocalDateTime.now());
            req.setRoomId(room.getId());
            chatPrivateRequestRepository.save(req);

            return ResponseEntity.ok(toRoomView(room, senderNames));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("No se pudo procesar la solicitud: " + e.getMessage());
        }
    }

    private Map<UUID, String> construirMapaRemitentes() {
        List<Usuario> usuarios = usuarioRepository.findAll();
        Map<UUID, String> map = new HashMap<>();
        for (Usuario u : usuarios) {
            if (u == null || u.getNombreUsuario() == null || u.getNombreUsuario().isBlank()) {
                continue;
            }
            String username = u.getNombreUsuario();
            map.put(generarChatIdActual(username), username);
            map.put(generarChatIdLegacy(username), username);
        }
        return map;
    }

    private String getAuthenticatedUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new IllegalStateException("No autenticado");
        }
        return auth.getName();
    }

    private UUID generarChatIdActual(String username) {
        return UUID.nameUUIDFromBytes(username.getBytes(StandardCharsets.UTF_8));
    }

    private UUID generarChatIdLegacy(String username) {
        Charset legacy = Charset.defaultCharset();
        return UUID.nameUUIDFromBytes(username.getBytes(legacy));
    }

    private ChatRoom findExistingPrivateRoomBetween(UUID userA, UUID userB) {
        Set<UUID> roomIdsA = chatUserRoomRepository.findById_UserId(userA).stream()
                .map(m -> m.getId().getRoomId())
                .collect(Collectors.toSet());
        Set<UUID> roomIdsB = chatUserRoomRepository.findById_UserId(userB).stream()
                .map(m -> m.getId().getRoomId())
                .collect(Collectors.toSet());
        roomIdsA.retainAll(roomIdsB);
        if (roomIdsA.isEmpty()) {
            return null;
        }
        return chatRoomRepository.findAllById(roomIdsA).stream()
                .filter(r -> !Boolean.TRUE.equals(r.getIsGroup()))
                .findFirst()
                .orElse(null);
    }

    private void createMembershipIfMissing(UUID roomId, UUID userId) {
        if (chatUserRoomRepository.existsById_RoomIdAndId_UserId(roomId, userId)) {
            return;
        }
        ChatUserRoom.ChatUserRoomId id = new ChatUserRoom.ChatUserRoomId(roomId, userId);
        chatUserRoomRepository.save(new ChatUserRoom(id, LocalDateTime.now()));
    }

    private String buildPrivateRoomName(String fromName, String toName) {
        List<String> names = List.of(
                fromName != null && !fromName.isBlank() ? fromName : "Usuario",
                toName != null && !toName.isBlank() ? toName : "Usuario");
        List<String> ordered = names.stream().sorted().toList();
        return "Privado: " + ordered.get(0) + " y " + ordered.get(1);
    }

    private ChatRoomView toRoomView(ChatRoom room, Map<UUID, String> senderNames) {
        String name = room.getName();
        if (!Boolean.TRUE.equals(room.getIsGroup())) {
            name = resolvePrivateRoomDisplayName(room, senderNames);
        }
        return new ChatRoomView(
                room.getId(),
                name,
                Boolean.TRUE.equals(room.getIsGroup()),
                room.getCreatedAt(),
                room.getCreatedBy());
    }

    private String resolvePrivateRoomDisplayName(ChatRoom room, Map<UUID, String> senderNames) {
        List<String> participantNames = chatUserRoomRepository.findById_RoomId(room.getId()).stream()
                .map(m -> m.getId().getUserId())
                .map(id -> senderNames.getOrDefault(id, id != null ? id.toString().substring(0, 8) : "Usuario"))
                .distinct()
                .sorted()
                .toList();
        if (participantNames.isEmpty()) {
            return room.getName() != null ? room.getName() : "Privado";
        }
        if (participantNames.size() == 1) {
            return "Privado: " + participantNames.get(0);
        }
        return "Privado: " + participantNames.get(0) + " y " + participantNames.get(1);
    }

    private ChatMessageView toView(ChatMessage m, Map<UUID, String> senderNames) {
        String senderName = null;
        if (m.getSenderId() != null) {
            senderName = senderNames.getOrDefault(m.getSenderId(), null);
        }
        return new ChatMessageView(
                m.getId(),
                m.getRoomId(),
                m.getSenderId(),
                senderName,
                m.getContent(),
                m.getCreatedAt() != null ? m.getCreatedAt() : LocalDateTime.now());
    }

    private record ChatMessageView(
            UUID id,
            @com.fasterxml.jackson.annotation.JsonProperty("room_id") UUID roomId,
            @com.fasterxml.jackson.annotation.JsonProperty("sender_id") UUID senderId,
            @com.fasterxml.jackson.annotation.JsonProperty("sender_name") String senderName,
            String content,
            @com.fasterxml.jackson.annotation.JsonProperty("created_at") LocalDateTime createdAt) {
    }

    private record ChatRoomView(
            UUID id,
            String name,
            @JsonProperty("is_group") boolean isGroup,
            @JsonProperty("created_at") LocalDateTime createdAt,
            @JsonProperty("created_by") UUID createdBy) {
    }

    private record ChatUserView(
            @JsonProperty("id_usuario") Long idUsuario,
            @JsonProperty("nombre_usuario") String nombreUsuario,
            @JsonProperty("chat_id") UUID chatId) {
    }

    private record PrivateRequestCreateRequest(@JsonProperty("to_user_id") Long toUserId) {
    }

    private record PrivateRequestView(
            Long id,
            @JsonProperty("from_user_id") UUID fromUserId,
            @JsonProperty("from_user_name") String fromUserName,
            @JsonProperty("to_user_id") UUID toUserId,
            @JsonProperty("to_user_name") String toUserName,
            String status,
            @JsonProperty("created_at") LocalDateTime createdAt,
            @JsonProperty("room_id") UUID roomId) {
    }

    private PrivateRequestView toPrivateRequestView(ChatPrivateRequest req, String fromUserName, String toUserName) {
        return new PrivateRequestView(
                req.getId(),
                req.getFromUserId(),
                fromUserName,
                req.getToUserId(),
                toUserName,
                req.getStatus() != null ? req.getStatus().name() : "PENDING",
                req.getCreatedAt(),
                req.getRoomId());
    }
}
