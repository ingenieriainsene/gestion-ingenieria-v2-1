package com.ingenieria.repository;

import com.ingenieria.model.ArchivoCliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArchivoClienteRepository extends JpaRepository<ArchivoCliente, Long> {
    List<ArchivoCliente> findByCliente_IdCliente(Long idCliente);
}
