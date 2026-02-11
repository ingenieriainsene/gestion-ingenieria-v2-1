package com.ingenieria.repository;

import com.ingenieria.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByNombreUsuario(String nombreUsuario);

    List<Usuario> findByRolOrderByNombreUsuarioAsc(Usuario.Rol rol);
}
