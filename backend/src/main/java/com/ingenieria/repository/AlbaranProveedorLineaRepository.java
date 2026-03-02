package com.ingenieria.repository;

import com.ingenieria.model.AlbaranProveedorLinea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlbaranProveedorLineaRepository extends JpaRepository<AlbaranProveedorLinea, Long> {
    List<AlbaranProveedorLinea> findByAlbaran_IdAlbaranOrderByOrdenAsc(Long albaranId);
}
