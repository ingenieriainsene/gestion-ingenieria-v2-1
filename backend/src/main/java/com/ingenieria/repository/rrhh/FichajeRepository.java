package com.ingenieria.repository.rrhh;

import com.ingenieria.model.rrhh.Fichaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FichajeRepository extends JpaRepository<Fichaje, UUID> {
    Optional<Fichaje> findByEmpleadoIdAndFecha(UUID empleadoId, LocalDate fecha);
}
