package com.ingenieria.repository;

import com.ingenieria.model.FacturaProveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FacturaProveedorRepository extends JpaRepository<FacturaProveedor, Long> {
    List<FacturaProveedor> findByProveedor_IdProveedor(Long idProveedor);

    List<FacturaProveedor> findByTramite_IdTramite(Long idTramite);
}
