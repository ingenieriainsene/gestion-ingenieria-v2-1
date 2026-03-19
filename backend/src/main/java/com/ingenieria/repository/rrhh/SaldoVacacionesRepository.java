package com.ingenieria.repository.rrhh;

import com.ingenieria.model.rrhh.SaldoVacaciones;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SaldoVacacionesRepository extends JpaRepository<SaldoVacaciones, UUID> {
    Optional<SaldoVacaciones> findByEmpleadoIdAndAnio(UUID empleadoId, Integer anio);
}
