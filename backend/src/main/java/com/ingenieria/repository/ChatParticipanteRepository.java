package com.ingenieria.repository;

import com.ingenieria.model.ChatParticipante;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatParticipanteRepository extends JpaRepository<ChatParticipante, Long> {
    List<ChatParticipante> findBySala_IdSala(Long salaId);

    List<ChatParticipante> findByUsuario_IdUsuario(Long usuarioId);
}
