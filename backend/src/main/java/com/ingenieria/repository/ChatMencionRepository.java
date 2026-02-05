package com.ingenieria.repository;

import com.ingenieria.model.ChatMencion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMencionRepository extends JpaRepository<ChatMencion, Long> {
}
