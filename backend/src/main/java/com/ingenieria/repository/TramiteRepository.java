package com.ingenieria.repository;

import com.ingenieria.model.Tramite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;

public interface TramiteRepository extends JpaRepository<Tramite, Long> {

    @EntityGraph(attributePaths = { "contrato", "contrato.cliente", "contrato.local" })
    List<Tramite> findByContrato_IdContrato(Long idContrato);

    @EntityGraph(attributePaths = { "contrato", "contrato.cliente", "contrato.local" })
    List<Tramite> findByEstadoOrderByFechaCreacionDesc(String estado);

    @EntityGraph(attributePaths = { "contrato", "contrato.cliente", "contrato.local" })
    List<Tramite> findByContrato_IdContratoAndEstadoOrderByFechaCreacionDesc(Long idContrato, String estado);

    boolean existsByContrato_IdContratoAndTipoTramiteAndFechaSeguimiento(Long idContrato, String tipoTramite,
            java.time.LocalDate fechaSeguimiento);

    java.util.Optional<Tramite> findByContrato_IdContratoAndTipoTramite(Long idContrato, String tipoTramite);

    /**
     * Trámites activos del contrato: estado IN ('En proceso', 'Terminado').
     * Para el Mapa Visual. Replica $res_activas de gestionar_contrato.php.
     */
    @EntityGraph(attributePaths = { "contrato", "contrato.cliente", "contrato.local" })
    List<Tramite> findByContrato_IdContratoAndEstadoIn(Long idContrato, List<String> estados);
}
