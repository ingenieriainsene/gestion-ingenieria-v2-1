package com.ingenieria.repository;

import com.ingenieria.model.AlbaranProveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AlbaranProveedorRepository extends JpaRepository<AlbaranProveedor, Long> {
    List<AlbaranProveedor> findByProveedor_IdProveedor(Long idProveedor);

    List<AlbaranProveedor> findByTramite_IdTramite(Long idTramite);
}
