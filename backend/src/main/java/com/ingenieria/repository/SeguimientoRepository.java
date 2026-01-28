package com.ingenieria.repository;

import com.ingenieria.model.Seguimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SeguimientoRepository extends JpaRepository<Seguimiento, Long> {
    List<Seguimiento> findByTramite_IdTramiteOrderByFechaRegistroDesc(Long idTramite);

    long countByTramite_IdTramite(Long idTramite);
}
