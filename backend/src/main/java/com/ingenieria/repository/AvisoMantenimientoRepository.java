package com.ingenieria.repository;

import com.ingenieria.model.AvisoMantenimiento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AvisoMantenimientoRepository extends JpaRepository<AvisoMantenimiento, Long> {
    Optional<AvisoMantenimiento> findByContrato_IdContratoMantAndFechaProgramada(Long idContratoMant, LocalDate fechaProgramada);

    List<AvisoMantenimiento> findByContrato_IdContratoMantOrderByFechaProgramadaAsc(Long idContratoMant);
}
