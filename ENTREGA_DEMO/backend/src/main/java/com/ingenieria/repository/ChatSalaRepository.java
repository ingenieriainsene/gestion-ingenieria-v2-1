package com.ingenieria.repository;

import com.ingenieria.model.ChatSala;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatSalaRepository extends JpaRepository<ChatSala, Long> {
    Optional<ChatSala> findByEsGlobalTrue();
}
