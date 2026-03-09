package com.ingenieria.task;

import com.ingenieria.service.AuditoriaSesionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Tarea programada para limpiar de forma periódica
 * los registros de auditoría de sesión antiguos.
 *
 * Se ejecuta diariamente a las 03:00 AM y elimina
 * las entradas cuya antigüedad supere el número de
 * días configurado en {@code audit.retention.days}.
 */
@Component
public class AuditRetentionCleanupTask {

  private static final Logger log = LoggerFactory.getLogger(AuditRetentionCleanupTask.class);

  private final AuditoriaSesionService auditoriaSesionService;
  private final int retentionDays;

  public AuditRetentionCleanupTask(
      AuditoriaSesionService auditoriaSesionService,
      @Value("${audit.retention.days:90}") int retentionDays
  ) {
    this.auditoriaSesionService = auditoriaSesionService;
    this.retentionDays = retentionDays;
  }

  /**
   * Cron: segundo, minuto, hora, día-mes, mes, día-semana.
   * Ejecuta la limpieza todos los días a las 03:00 AM.
   */
  @Scheduled(cron = "0 0 3 * * *")
  public void purgeOldSessions() {
    long deleted = auditoriaSesionService.purgeOlderThanDays(retentionDays);
    if (deleted > 0) {
      log.info("[AuditRetentionCleanupTask] Eliminadas {} sesiones de auditoría (retención {} días).",
          deleted, retentionDays);
    } else {
      log.info("[AuditRetentionCleanupTask] No se encontraron sesiones antiguas para eliminar (retención {} días).",
          retentionDays);
    }
  }
}

