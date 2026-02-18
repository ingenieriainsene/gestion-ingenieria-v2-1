package com.ingenieria.repository;

import com.ingenieria.model.AreaFuncional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AreaFuncionalRepository extends JpaRepository<AreaFuncional, Long> {
    List<AreaFuncional> findByLocalIdLocal(Long idLocal);
}
