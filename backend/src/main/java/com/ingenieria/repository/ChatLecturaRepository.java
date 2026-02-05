package com.ingenieria.repository;

import com.ingenieria.model.ChatLectura;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatLecturaRepository extends JpaRepository<ChatLectura, Long> {
    Optional<ChatLectura> findByMensaje_IdMensajeAndUsuario_IdUsuario(Long mensajeId, Long usuarioId);
}
