package com.ingenieria.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "chat_private_requests", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class ChatPrivateRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    @EqualsAndHashCode.Include
    private Long id;

    @Column(name = "from_user_id", nullable = false)
    @JsonProperty("from_user_id")
    private UUID fromUserId;

    @Column(name = "to_user_id", nullable = false)
    @JsonProperty("to_user_id")
    private UUID toUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private Status status = Status.PENDING;

    @Column(name = "room_id")
    @JsonProperty("room_id")
    private UUID roomId;

    @Column(name = "created_at", updatable = false)
    @JsonProperty("created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "responded_at")
    @JsonProperty("responded_at")
    private LocalDateTime respondedAt;

    public enum Status {
        PENDING,
        ACCEPTED,
        REJECTED
    }
}
