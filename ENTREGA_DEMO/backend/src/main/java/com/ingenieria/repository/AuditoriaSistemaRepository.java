package com.ingenieria.repository;

import com.ingenieria.model.AuditoriaSistema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditoriaSistemaRepository extends JpaRepository<AuditoriaSistema, Long> {
    // Si se necesita filtrar por tabla o fecha se pueden añadir métodos aquí
    List<AuditoriaSistema> findAllByOrderByFechaCambioDesc();
}
