package com.ingenieria.repository;

import com.ingenieria.model.AvisoMantenimientoDetalle;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AvisoMantenimientoDetalleRepository extends JpaRepository<AvisoMantenimientoDetalle, Long> {
    boolean existsByAviso_IdAvisoAndTarea_IdTareaContrato(Long idAviso, Long idTareaContrato);
}
