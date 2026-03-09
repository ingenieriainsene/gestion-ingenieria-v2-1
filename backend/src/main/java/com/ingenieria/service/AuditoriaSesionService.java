package com.ingenieria.service;

import com.ingenieria.model.AuditoriaSesion;
import com.ingenieria.repository.AuditoriaSesionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Servicio de dominio para consultas y mantenimiento
 * de los registros de auditoría de sesión de usuarios.
 */
@Service
public class AuditoriaSesionService {

  private final AuditoriaSesionRepository auditoriaSesionRepository;

  public AuditoriaSesionService(AuditoriaSesionRepository auditoriaSesionRepository) {
    this.auditoriaSesionRepository = auditoriaSesionRepository;
  }

  /**
   * Devuelve una página de sesiones de auditoría ordenadas
   * de la más reciente a la más antigua.
   */
  @Transactional(readOnly = true)
  public Page<AuditoriaSesion> getSesiones(Pageable pageable) {
    return auditoriaSesionRepository.findAllByOrderByFechaInicioDesc(pageable);
  }

  /**
   * Elimina permanentemente las sesiones cuya fecha de inicio
   * sea anterior al número de días indicado.
   *
   * @param retentionDays días a conservar (por ejemplo, 90)
   * @return número de filas eliminadas
   */
  @Transactional
  public long purgeOlderThanDays(int retentionDays) {
    LocalDate fechaCorte = LocalDate.now().minusDays(retentionDays);
    LocalDateTime inicioDiaCorte = fechaCorte.atStartOfDay();
    return auditoriaSesionRepository.deleteByFechaInicioBefore(inicioDiaCorte);
  }
}

