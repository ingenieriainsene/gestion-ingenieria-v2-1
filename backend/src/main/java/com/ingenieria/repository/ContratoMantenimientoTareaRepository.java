package com.ingenieria.repository;

import com.ingenieria.model.ContratoMantenimientoTarea;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContratoMantenimientoTareaRepository extends JpaRepository<ContratoMantenimientoTarea, Long> {
    List<ContratoMantenimientoTarea> findByContrato_IdContratoMantAndActivoTrue(Long idContratoMant);
}
