package com.ingenieria.repository;

import com.ingenieria.model.PresupuestoLinea;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PresupuestoLineaRepository extends JpaRepository<PresupuestoLinea, UUID> {
}
