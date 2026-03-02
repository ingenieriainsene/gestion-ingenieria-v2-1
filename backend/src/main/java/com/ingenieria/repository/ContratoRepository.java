package com.ingenieria.repository;

import com.ingenieria.model.Contrato;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface ContratoRepository extends JpaRepository<Contrato, Long> {
    List<Contrato> findAll();

    @Modifying
    @Query("""
            update Contrato c
               set c.estado = 'Terminado'
             where c.fechaVencimiento < :hoy
               and (c.estado is null or lower(c.estado) = 'activo')
            """)
    int marcarVencidos(@Param("hoy") LocalDate hoy);
}
