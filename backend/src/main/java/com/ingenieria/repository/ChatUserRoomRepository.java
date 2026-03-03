package com.ingenieria.repository;

import com.ingenieria.model.ChatUserRoom;
import com.ingenieria.model.ChatUserRoom.ChatUserRoomId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ChatUserRoomRepository extends JpaRepository<ChatUserRoom, ChatUserRoomId> {
    List<ChatUserRoom> findById_UserId(UUID userId);

    List<ChatUserRoom> findById_RoomId(UUID roomId);

    boolean existsById_RoomIdAndId_UserId(UUID roomId, UUID userId);
}
