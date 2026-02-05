package com.ingenieria.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "CHAT_MENCIONES")
public class ChatMencion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_mencion")
    private Long idMencion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mensaje_id", nullable = false)
    private ChatMensaje mensaje;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
}
