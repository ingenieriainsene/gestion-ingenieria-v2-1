package com.ingenieria.task;

import com.ingenieria.repository.AuditoriaSesionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
public class SessionCleanupTask {

    private static final Logger log = LoggerFactory.getLogger(SessionCleanupTask.class);

    @Autowired
    private AuditoriaSesionRepository auditoriaSesionRepository;

    /**
     * Esta tarea queda desactivada por defecto para no cerrar sesiones automáticamente.
     * Solo se activa si se configura explícitamente app.session.cleanup.cron.
     */
    @Scheduled(cron = "${app.session.cleanup.cron:-}")
    @Transactional
    public void cleanupZombieSessions() {
        log.info("[Task] Verificando actividad de sesiones (task opcional activada)...");

        LocalDateTime limit = LocalDateTime.now().minusMinutes(5);

        auditoriaSesionRepository.findAll().stream()
                .filter(s -> "Conectado".equals(s.getEstado()) &&
                        (s.getFechaUltimaActividad() == null || s.getFechaUltimaActividad().isBefore(limit)))
                .forEach(s -> {
                    log.info("[Task] Marcando sesión como inactiva (timeout) para usuario: {}", s.getNombreUsuario());
                    s.setEstado("Desconectado");
                    s.setFechaFin(LocalDateTime.now());
                    auditoriaSesionRepository.save(s);
                });
    }
}
