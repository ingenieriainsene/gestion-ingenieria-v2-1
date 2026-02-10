package com.ingenieria.controller;

import com.ingenieria.model.Usuario;
import com.ingenieria.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping
    public List<Usuario> listarUsuarios() {
        return usuarioRepository.findAll();
    }

    @GetMapping("/tecnicos")
    public List<Usuario> listarTecnicos() {
        return usuarioRepository.findByRolOrderByNombreUsuarioAsc(Usuario.Rol.TÉCNICO);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> obtenerUsuario(@PathVariable Long id) {
        return usuarioRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Usuario> crearUsuario(@RequestBody Usuario usuario) {
        if (usuario.getIdUsuario() != null) {
            usuario.setIdUsuario(null);
        }
        Usuario guardado = usuarioRepository.save(usuario);
        return ResponseEntity.ok(guardado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Usuario> actualizarUsuario(@PathVariable Long id, @RequestBody Usuario usuario) {
        return usuarioRepository.findById(id)
                .map(existing -> {
                    existing.setNombreUsuario(usuario.getNombreUsuario());
                    existing.setPasswordHash(usuario.getPasswordHash());
                    existing.setEmail(usuario.getEmail());
                    existing.setRol(usuario.getRol());
                    return ResponseEntity.ok(usuarioRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarUsuario(@PathVariable Long id) {
        if (!usuarioRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        usuarioRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
