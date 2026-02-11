package com.ingenieria.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "CHAT_ADJUNTOS")
public class ChatAdjunto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_adjunto")
    private Long idAdjunto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mensaje_id", nullable = false)
    private ChatMensaje mensaje;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String url;

    @Column(length = 50)
    private String tipo;

    @Column(length = 255)
    private String nombre;
}
