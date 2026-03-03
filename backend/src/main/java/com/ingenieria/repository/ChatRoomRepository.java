package com.ingenieria.repository;

import com.ingenieria.model.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {
    List<ChatRoom> findByIsGroupTrueOrderByCreatedAtAsc();
}
