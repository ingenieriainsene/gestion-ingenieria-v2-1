package com.ingenieria.repository;

import com.ingenieria.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findTop200ByRoomIdOrderByCreatedAtAsc(UUID roomId);
}
