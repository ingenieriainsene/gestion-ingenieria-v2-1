package com.ingenieria.repository;

import com.ingenieria.model.Cita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CitaRepository extends JpaRepository<Cita, Long> {
    @Query("SELECT c FROM Cita c " +
           "WHERE c.fechaInicio < :to AND c.fechaFin > :from")
    List<Cita> findByRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT c FROM Cita c " +
           "WHERE c.usuario.idUsuario = :usuarioId " +
           "AND c.fechaInicio < :to AND c.fechaFin > :from " +
           "AND (:excludeId IS NULL OR c.idCita <> :excludeId)")
    List<Cita> findOverlaps(@Param("usuarioId") Long usuarioId,
                            @Param("from") LocalDateTime from,
                            @Param("to") LocalDateTime to,
                            @Param("excludeId") Long excludeId);
}
