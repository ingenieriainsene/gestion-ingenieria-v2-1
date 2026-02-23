package com.ingenieria.repository;

import com.ingenieria.model.ContratoMantenimiento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ContratoMantenimientoRepository extends JpaRepository<ContratoMantenimiento, Long> {
       Optional<ContratoMantenimiento> findById(Long id);

       Optional<ContratoMantenimiento> findByPresupuestoPreventivo_IdPresupuestoPrev(Long id);
}
