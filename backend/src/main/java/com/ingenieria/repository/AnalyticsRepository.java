package com.ingenieria.repository;

import com.ingenieria.model.Tramite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/**
 * Repositorio de solo lectura para el módulo de Análisis de Datos.
 * Extiende {@link JpaSpecificationExecutor} para permitir filtros dinámicos
 * sin JPQL manual, evitando problemas de resolución de campos en Hibernate 6.
 */
public interface AnalyticsRepository
    extends JpaRepository<Tramite, Long>, JpaSpecificationExecutor<Tramite> {
  // Los filtros y la paginación se construyen dinámicamente en AnalyticsService
  // mediante la Criteria API / Specification. No necesitamos @Query aquí.
}
