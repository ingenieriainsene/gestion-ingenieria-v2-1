package com.ingenieria.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chat_user_rooms", schema = "public")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatUserRoom {

    @EmbeddedId
    private ChatUserRoomId id;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt = LocalDateTime.now();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Embeddable
    public static class ChatUserRoomId implements Serializable {
        @Column(name = "room_id")
        private UUID roomId;

        @Column(name = "user_id")
        private UUID userId;
    }
}
