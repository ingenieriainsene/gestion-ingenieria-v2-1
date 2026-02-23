package com.ingenieria.repository;

import com.ingenieria.model.Local;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.EntityGraph;
import java.util.List;

public interface LocalRepository extends JpaRepository<Local, Long> {
    @EntityGraph(attributePaths = { "cliente" })
    List<Local> findAll();
}
