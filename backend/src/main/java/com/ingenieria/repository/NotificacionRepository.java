package com.ingenieria.repository;

import com.ingenieria.model.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {
    List<Notificacion> findByUsuario_IdUsuarioOrderByFechaCreacionDesc(Long idUsuario);
    List<Notificacion> findByUsuario_IdUsuarioAndLeidaFalseOrderByFechaCreacionDesc(Long idUsuario);
}
