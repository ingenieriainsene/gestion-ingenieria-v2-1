package com.ingenieria.service;

import com.ingenieria.model.Notificacion;
import com.ingenieria.model.Usuario;
import com.ingenieria.repository.NotificacionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class NotificacionService {

    @Autowired
    private NotificacionRepository notificacionRepo;

    public List<Notificacion> getNotificacionesByUsuario(Long idUsuario) {
        return notificacionRepo.findByUsuario_IdUsuarioOrderByFechaCreacionDesc(idUsuario);
    }

    public List<Notificacion> getNotificacionesNoLeidas(Long idUsuario) {
        return notificacionRepo.findByUsuario_IdUsuarioAndLeidaFalseOrderByFechaCreacionDesc(idUsuario);
    }

    @Transactional
    public void crearNotificacion(Usuario usuario, String mensaje, String link) {
        if (usuario == null) return;
        Notificacion n = new Notificacion();
        n.setUsuario(usuario);
        n.setMensaje(mensaje);
        n.setLink(link);
        n.setLeida(false);
        notificacionRepo.save(n);
    }

    @Transactional
    public void marcarComoLeida(Long idNotificacion) {
        notificacionRepo.findById(idNotificacion).ifPresent(n -> {
            n.setLeida(true);
            notificacionRepo.save(n);
        });
    }

    @Transactional
    public void marcarTodasComoLeidas(Long idUsuario) {
        List<Notificacion> noLeidas = notificacionRepo.findByUsuario_IdUsuarioAndLeidaFalseOrderByFechaCreacionDesc(idUsuario);
        for (Notificacion n : noLeidas) {
            n.setLeida(true);
        }
        notificacionRepo.saveAll(noLeidas);
    }
}
