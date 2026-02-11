package com.ingenieria.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "CHAT_PARTICIPANTES")
public class ChatParticipante {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idParticipante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sala_id", nullable = false)
    private ChatSala sala;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
}
