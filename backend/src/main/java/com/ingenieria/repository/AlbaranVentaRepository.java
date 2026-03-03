package com.ingenieria.repository;

import com.ingenieria.model.AlbaranVenta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlbaranVentaRepository extends JpaRepository<AlbaranVenta, Long> {
    Optional<AlbaranVenta> findByPresupuesto_IdPresupuesto(Long presupuestoId);

    List<AlbaranVenta> findByTramite_IdTramite(Long tramiteId);

    long countByTramite_IdTramite(Long tramiteId);
}
