package com.ingenieria.repository;

import com.ingenieria.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import java.util.List;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    @EntityGraph(attributePaths = { "locales" })
    List<Cliente> findAll();

    @EntityGraph(attributePaths = { "locales" })
    List<Cliente> findByNombreContainingOrApellido1ContainingOrDniContaining(String nombre, String apellido,
            String dni);
}
