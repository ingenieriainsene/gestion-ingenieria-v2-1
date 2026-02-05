package com.ingenieria.controller;

import com.ingenieria.dto.*;
import com.ingenieria.model.ChatSala;
import com.ingenieria.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:4200")
public class ChatController {
    private final ChatService service;

    public ChatController(ChatService service) {
        this.service = service;
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
            return ResponseEntity.badRequest().body("No se pudo subir el archivo");
        }
    }

    @MessageMapping("/chat.send")
    @SendTo("/topic/chat.general")
    public ChatMessageDTO send(ChatSendRequest req) {
        return service.guardarMensaje(req);
    }
}
