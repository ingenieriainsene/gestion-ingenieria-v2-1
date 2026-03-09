package com.ingenieria.repository;

import com.ingenieria.model.TecnicoInstalador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TecnicoInstaladorRepository extends JpaRepository<TecnicoInstalador, Long> {
    List<TecnicoInstalador> findByActivoTrueOrderByNombreAsc();

    List<TecnicoInstalador> findAllByOrderByNombreAsc();
}
