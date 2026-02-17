package com.ingenieria.repository;

import com.ingenieria.model.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {
}
