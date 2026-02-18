package com.ingenieria.repository;

import com.ingenieria.model.AreaFuncionalLinea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AreaFuncionalLineaRepository extends JpaRepository<AreaFuncionalLinea, Long> {
}
