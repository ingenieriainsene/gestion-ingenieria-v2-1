package com.ingenieria.repository;

import com.ingenieria.model.ArchivoAdjunto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ArchivoAdjuntoRepository extends JpaRepository<ArchivoAdjunto, UUID> {
    List<ArchivoAdjunto> findByEntidadTipoAndEntidadIdOrderByFechaCreacionDesc(String entidadTipo, Long entidadId);
}
