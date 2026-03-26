package com.ingenieria.controller;

import com.ingenieria.model.Notificacion;
import com.ingenieria.model.Usuario;
import com.ingenieria.repository.UsuarioRepository;
import com.ingenieria.service.NotificacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notificaciones")
public class NotificacionController {

    @Autowired
    private NotificacionService notificacionService;

    @Autowired
    private UsuarioRepository usuarioRepo;

    @GetMapping
    public List<Notificacion> getMisNotificaciones(Authentication auth) {
        Usuario u = usuarioRepo.findByNombreUsuario(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return notificacionService.getNotificacionesByUsuario(u.getIdUsuario());
    }

    @GetMapping("/no-leidas")
    public List<Notificacion> getMisNotificacionesNoLeidas(Authentication auth) {
        Usuario u = usuarioRepo.findByNombreUsuario(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return notificacionService.getNotificacionesNoLeidas(u.getIdUsuario());
    }

    @PutMapping("/{id}/leer")
    public ResponseEntity<?> marcarComoLeida(@PathVariable Long id) {
        notificacionService.marcarComoLeida(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/leer-todas")
    public ResponseEntity<?> marcarTodasComoLeidas(Authentication auth) {
        Usuario u = usuarioRepo.findByNombreUsuario(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        notificacionService.marcarTodasComoLeidas(u.getIdUsuario());
        return ResponseEntity.ok().build();
    }
}
