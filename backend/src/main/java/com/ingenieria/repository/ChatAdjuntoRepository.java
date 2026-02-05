package com.ingenieria.repository;

import com.ingenieria.model.ChatAdjunto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatAdjuntoRepository extends JpaRepository<ChatAdjunto, Long> {
    List<ChatAdjunto> findByMensaje_IdMensaje(Long mensajeId);
}
