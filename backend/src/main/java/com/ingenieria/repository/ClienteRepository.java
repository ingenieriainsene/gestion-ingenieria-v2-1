package com.ingenieria.repository;

import com.ingenieria.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    // Eliminamos EntityGraph con múltiples colecciones para evitar Producto Cartesiano.
    // Usamos @BatchSize en la entidad Cliente para carga eficiente.
    List<Cliente> findAll();

    List<Cliente> findByNombreContainingOrApellido1ContainingOrDniContaining(String nombre, String apellido,
            String dni);

    boolean existsByDni(String dni);

    java.util.Optional<Cliente> findByDni(String dni);
}
