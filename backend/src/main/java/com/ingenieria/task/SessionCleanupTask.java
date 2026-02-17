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
     * Limpia las sesiones que no han tenido actividad en los últimos 5 minutos.
     * Se ejecuta cada minuto.
     */
    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void cleanupZombieSessions() {
        log.info("[Task] Verificando actividad de sesiones...");

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
