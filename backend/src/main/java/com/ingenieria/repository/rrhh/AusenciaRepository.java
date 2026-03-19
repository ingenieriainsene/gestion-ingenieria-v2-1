package com.ingenieria.repository.rrhh;

import com.ingenieria.model.rrhh.Ausencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AusenciaRepository extends JpaRepository<Ausencia, UUID> {
}
