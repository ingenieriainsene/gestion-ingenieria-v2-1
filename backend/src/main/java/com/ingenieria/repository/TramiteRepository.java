package com.ingenieria.repository;

import com.ingenieria.model.Tramite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TramiteRepository extends JpaRepository<Tramite, Long> {

    List<Tramite> findByContrato_IdContrato(Long idContrato);

    List<Tramite> findByEstado(String estado);

    List<Tramite> findByContrato_IdContratoAndEstadoOrderByFechaCreacionDesc(Long idContrato, String estado);

    /**
     * Trámites activos del contrato: estado IN ('En proceso', 'Terminado').
     * Para el Mapa Visual. Replica $res_activas de gestionar_contrato.php.
     */
    List<Tramite> findByContrato_IdContratoAndEstadoIn(Long idContrato, List<String> estados);
}
