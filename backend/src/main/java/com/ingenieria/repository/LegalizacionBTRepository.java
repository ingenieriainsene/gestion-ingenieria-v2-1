package com.ingenieria.repository;

import com.ingenieria.model.LegalizacionBT;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LegalizacionBTRepository extends JpaRepository<LegalizacionBT, Long> {
    List<LegalizacionBT> findByIdLocalOrderByFechaAltaDesc(Long idLocal);
    List<LegalizacionBT> findByIdTramite(Long idTramite);
}
