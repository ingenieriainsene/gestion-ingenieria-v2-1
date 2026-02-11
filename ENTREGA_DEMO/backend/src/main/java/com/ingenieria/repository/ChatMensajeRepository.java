package com.ingenieria.repository;

import com.ingenieria.model.ChatMensaje;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMensajeRepository extends JpaRepository<ChatMensaje, Long> {
    List<ChatMensaje> findTop100BySala_IdSalaOrderByFechaEnvioDesc(Long salaId);
}
