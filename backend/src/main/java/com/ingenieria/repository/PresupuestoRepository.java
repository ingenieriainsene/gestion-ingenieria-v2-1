package com.ingenieria.repository;

import com.ingenieria.model.Presupuesto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PresupuestoRepository extends JpaRepository<Presupuesto, Long> {
    @Query("SELECT DISTINCT p FROM Presupuesto p LEFT JOIN FETCH p.lineas")
    List<Presupuesto> findAllWithLineas();

    @Query("SELECT DISTINCT p FROM Presupuesto p LEFT JOIN FETCH p.lineas WHERE p.idPresupuesto = :id")
    Optional<Presupuesto> findByIdWithLineas(@Param("id") Long id);
}
