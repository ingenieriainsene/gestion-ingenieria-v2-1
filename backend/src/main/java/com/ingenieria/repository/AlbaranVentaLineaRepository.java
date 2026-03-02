package com.ingenieria.repository;

import com.ingenieria.model.AlbaranVentaLinea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlbaranVentaLineaRepository extends JpaRepository<AlbaranVentaLinea, Long> {
    long countByAlbaran_IdAlbaran(Long albaranId);

    List<AlbaranVentaLinea> findByAlbaran_IdAlbaranOrderByOrdenAsc(Long albaranId);
}
