package com.ingenieria.repository;

import com.ingenieria.model.Presupuesto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PresupuestoRepository extends JpaRepository<Presupuesto, Long> {
       @org.springframework.data.jpa.repository.EntityGraph(attributePaths = { "cliente", "vivienda", "tramite" })
       List<Presupuesto> findAll();

       @Query("SELECT DISTINCT p FROM Presupuesto p " +
                     "LEFT JOIN FETCH p.cliente " +
                     "LEFT JOIN FETCH p.vivienda " +
                     "LEFT JOIN FETCH p.tramite " +
                     "LEFT JOIN FETCH p.lineas " +
                     "ORDER BY p.fecha DESC, p.idPresupuesto DESC")
       List<Presupuesto> findAllWithLineas();

       @Query("SELECT p FROM Presupuesto p " +
                     "LEFT JOIN FETCH p.cliente " +
                     "LEFT JOIN FETCH p.vivienda " +
                     "LEFT JOIN FETCH p.tramite " +
                     "LEFT JOIN FETCH p.lineas " +
                     "WHERE p.idPresupuesto = :id")
       Optional<Presupuesto> findByIdWithLineas(@Param("id") Long id);

       @Query("SELECT p FROM Presupuesto p " +
                     "LEFT JOIN FETCH p.cliente " +
                     "LEFT JOIN FETCH p.vivienda " +
                     "WHERE p.tramite.idTramite = :idTramite " +
                     "ORDER BY p.fecha DESC, p.idPresupuesto DESC")
       List<Presupuesto> findByTramiteId(@Param("idTramite") Long idTramite);

       @Query("SELECT p FROM Presupuesto p " +
                     "LEFT JOIN FETCH p.cliente " +
                     "LEFT JOIN FETCH p.vivienda " +
                     "WHERE p.contrato.idContrato = :idContrato " +
                     "ORDER BY p.fecha DESC, p.idPresupuesto DESC")
       List<Presupuesto> findByContratoId(@Param("idContrato") Long idContrato);

       @Query("SELECT p FROM Presupuesto p " +
                     "LEFT JOIN FETCH p.cliente " +
                     "LEFT JOIN FETCH p.vivienda " +
                     "WHERE p.cliente.idCliente = :idCliente " +
                     "ORDER BY p.fecha DESC, p.idPresupuesto DESC")
       List<Presupuesto> findByClienteId(@Param("idCliente") Long idCliente);
}
