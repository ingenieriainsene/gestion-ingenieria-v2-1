package com.ingenieria.repository;

import com.ingenieria.model.FacturaProveedorLinea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacturaProveedorLineaRepository extends JpaRepository<FacturaProveedorLinea, Long> {
    List<FacturaProveedorLinea> findByFactura_IdFacturaOrderByOrdenAsc(Long facturaId);
}
