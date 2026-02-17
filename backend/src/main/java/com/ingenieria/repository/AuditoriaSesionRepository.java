package com.ingenieria.repository;

import com.ingenieria.model.AuditoriaSesion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuditoriaSesionRepository extends JpaRepository<AuditoriaSesion, Long> {

    List<AuditoriaSesion> findAllByOrderByFechaInicioDesc();

    List<AuditoriaSesion> findAllByIdUsuarioAndEstado(Long idUsuario, String estado);

    Optional<AuditoriaSesion> findTopByIdUsuarioAndEstadoOrderByFechaInicioDesc(Long idUsuario, String estado);
}
