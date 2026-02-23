package com.ingenieria.repository;

import com.ingenieria.model.PresupuestoPreventivo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PresupuestoPreventivoRepository extends JpaRepository<PresupuestoPreventivo, Long> {
       @Query("SELECT p FROM PresupuestoPreventivo p " +
                     "LEFT JOIN FETCH p.cliente " +
                     "LEFT JOIN FETCH p.vivienda")
       List<PresupuestoPreventivo> findAllWithTareas();

       @Query("SELECT p FROM PresupuestoPreventivo p " +
                     "LEFT JOIN FETCH p.cliente " +
                     "LEFT JOIN FETCH p.vivienda " +
                     "WHERE p.idPresupuestoPrev = :id")
       Optional<PresupuestoPreventivo> findByIdWithTareas(@Param("id") Long id);

       Optional<PresupuestoPreventivo> findByPresupuesto_IdPresupuesto(Long idPresupuesto);
}
