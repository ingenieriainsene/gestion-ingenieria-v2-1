package com.ingenieria.repository;

import com.ingenieria.model.LocalArea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LocalAreaRepository extends JpaRepository<LocalArea, Long> {
}
