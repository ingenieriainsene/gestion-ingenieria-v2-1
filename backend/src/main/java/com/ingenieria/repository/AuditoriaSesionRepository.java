package com.ingenieria.repository;

import com.ingenieria.model.AuditoriaSesion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuditoriaSesionRepository extends JpaRepository<AuditoriaSesion, Long> {

    List<AuditoriaSesion> findAllByOrderByFechaInicioDesc();

    Page<AuditoriaSesion> findAllByOrderByFechaInicioDesc(Pageable pageable);

    List<AuditoriaSesion> findAllByIdUsuarioAndEstado(Long idUsuario, String estado);

    Optional<AuditoriaSesion> findTopByIdUsuarioAndEstadoOrderByFechaInicioDesc(Long idUsuario, String estado);

    long deleteByFechaInicioBefore(LocalDateTime fechaCorte);
}
