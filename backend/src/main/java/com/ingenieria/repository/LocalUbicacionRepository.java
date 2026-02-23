package com.ingenieria.repository;

import com.ingenieria.model.LocalUbicacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LocalUbicacionRepository extends JpaRepository<LocalUbicacion, Long> {
}
