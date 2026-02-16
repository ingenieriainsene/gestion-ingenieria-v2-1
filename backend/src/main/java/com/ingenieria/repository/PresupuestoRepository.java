package com.ingenieria.repository;

import com.ingenieria.model.Presupuesto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PresupuestoRepository extends JpaRepository<Presupuesto, Long> {
       @Query("SELECT DISTINCT p FROM Presupuesto p " +
                     "LEFT JOIN FETCH p.lineas l " +
                     "LEFT JOIN FETCH l.padre " +
                     "LEFT JOIN FETCH p.cliente " +
                     "LEFT JOIN FETCH p.vivienda")
       List<Presupuesto> findAllWithLineas();

       @Query("SELECT DISTINCT p FROM Presupuesto p " +
                     "LEFT JOIN FETCH p.lineas l " +
                     "LEFT JOIN FETCH l.padre " +
                     "LEFT JOIN FETCH p.cliente " +
                     "LEFT JOIN FETCH p.vivienda " +
                     "WHERE p.idPresupuesto = :id")
       Optional<Presupuesto> findByIdWithLineas(@Param("id") Long id);

       @Query("SELECT DISTINCT p FROM Presupuesto p " +
                     "LEFT JOIN FETCH p.lineas l " +
                     "LEFT JOIN FETCH l.padre " +
                     "LEFT JOIN FETCH p.cliente " +
                     "LEFT JOIN FETCH p.vivienda " +
                     "WHERE p.tramite.idTramite = :idTramite")
       List<Presupuesto> findByTramiteId(@Param("idTramite") Long idTramite);
}
