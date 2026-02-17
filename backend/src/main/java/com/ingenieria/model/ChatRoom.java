package com.ingenieria.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chat_rooms", schema = "public")
@Data
public class ChatRoom {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @org.hibernate.annotations.UuidGenerator
    private UUID id;

    @Column(name = "name")
    private String name;

    @Column(name = "is_group")
    @JsonProperty("is_group")
    private Boolean isGroup = false;

    @Column(name = "created_at", updatable = false)
    @JsonProperty("created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "created_by")
    @JsonProperty("created_by")
    private UUID createdBy;
}
