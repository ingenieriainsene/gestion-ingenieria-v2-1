package com.ingenieria.repository;

import com.ingenieria.model.ContratoMantenimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ContratoMantenimientoRepository extends JpaRepository<ContratoMantenimiento, Long> {
       Optional<ContratoMantenimiento> findById(Long id);

       Optional<ContratoMantenimiento> findByPresupuestoPreventivo_IdPresupuestoPrev(Long id);
}
