package com.ingenieria.repository;

import com.ingenieria.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
}
