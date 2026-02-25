package com.ingenieria.repository;

import com.ingenieria.model.ClienteTelefono;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClienteTelefonoRepository extends JpaRepository<ClienteTelefono, Long> {
}
