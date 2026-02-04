package com.ingenieria.repository;

import com.ingenieria.model.ContratoMantenimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ContratoMantenimientoRepository extends JpaRepository<ContratoMantenimiento, Long> {
    @Query("SELECT c FROM ContratoMantenimiento c " +
           "LEFT JOIN FETCH c.tareas t " +
           "WHERE c.idContratoMant = :id")
    Optional<ContratoMantenimiento> findByIdWithTareas(@Param("id") Long id);

    Optional<ContratoMantenimiento> findByPresupuestoPreventivo_IdPresupuestoPrev(Long idPresupuestoPrev);

    @Query("SELECT c FROM ContratoMantenimiento c " +
           "LEFT JOIN FETCH c.tareas t " +
           "WHERE c.presupuestoPreventivo.idPresupuestoPrev = :id")
    Optional<ContratoMantenimiento> findByPresupuestoPreventivoWithTareas(@Param("id") Long id);
}
