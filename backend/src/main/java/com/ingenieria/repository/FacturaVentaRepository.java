package com.ingenieria.repository;

import com.ingenieria.model.FacturaVenta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FacturaVentaRepository extends JpaRepository<FacturaVenta, Long> {
    Optional<FacturaVenta> findByPresupuesto_IdPresupuesto(Long presupuestoId);
}
