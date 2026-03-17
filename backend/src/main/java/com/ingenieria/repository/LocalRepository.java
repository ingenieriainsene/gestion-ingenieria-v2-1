package com.ingenieria.repository;

import com.ingenieria.model.Local;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

import java.util.Optional;

public interface LocalRepository extends JpaRepository<Local, Long> {
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = { "cliente" })
    List<Local> findAll();

    Optional<Local> findByReferenciaCatastral(String referenciaCatastral);
}
