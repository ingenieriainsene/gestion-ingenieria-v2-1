package com.ingenieria.repository;

import com.ingenieria.model.FacturaProveedor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FacturaProveedorRepository extends JpaRepository<FacturaProveedor, Long> {
    List<FacturaProveedor> findByProveedor_IdProveedor(Long idProveedor);

    List<FacturaProveedor> findByTramite_IdTramite(Long idTramite);

    Optional<FacturaProveedor> findByTramite_IdTramiteAndProveedor_IdProveedor(Long idTramite, Long idProveedor);
}
