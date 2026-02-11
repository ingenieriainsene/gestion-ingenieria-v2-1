package com.ingenieria.repository;

import com.ingenieria.model.ArchivoTramite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArchivoTramiteRepository extends JpaRepository<ArchivoTramite, Long> {
    List<ArchivoTramite> findByTramite_IdTramite(Long idTramite);
}
