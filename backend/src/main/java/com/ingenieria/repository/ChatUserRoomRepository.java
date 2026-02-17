package com.ingenieria.repository;

import com.ingenieria.model.ChatUserRoom;
import com.ingenieria.model.ChatUserRoom.ChatUserRoomId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatUserRoomRepository extends JpaRepository<ChatUserRoom, ChatUserRoomId> {
}
