package com.ingenieria.repository.rrhh;

import com.ingenieria.model.rrhh.Empleado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmpleadoRepository extends JpaRepository<Empleado, UUID> {
    Optional<Empleado> findByAuthUserId(UUID authUserId);
}
