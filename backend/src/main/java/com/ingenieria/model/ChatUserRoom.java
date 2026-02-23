package com.ingenieria.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.EqualsAndHashCode;

@Getter
@Setter
@ToString
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "chat_user_rooms", schema = "public")
public class ChatUserRoom {

    @EmbeddedId
    @EqualsAndHashCode.Include
    private ChatUserRoomId id;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt = LocalDateTime.now();

    @Getter
    @Setter
    @ToString
    @EqualsAndHashCode
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
