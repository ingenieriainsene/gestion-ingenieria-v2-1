package com.ingenieria.controller;

import com.ingenieria.model.Usuario;
import com.ingenieria.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

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
        if (usuario.getPasswordHash() == null || usuario.getPasswordHash().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (!esHashBcrypt(usuario.getPasswordHash())) {
            usuario.setPasswordHash(passwordEncoder.encode(usuario.getPasswordHash()));
        }
        Usuario guardado = usuarioRepository.save(usuario);
        return ResponseEntity.ok(guardado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Usuario> actualizarUsuario(@PathVariable Long id, @RequestBody Usuario usuario) {
        return usuarioRepository.findById(id)
                .map(existing -> {
                    existing.setNombreUsuario(usuario.getNombreUsuario());
                    existing.setEmail(usuario.getEmail());
                    existing.setRol(usuario.getRol());
                    // Solo actualiza password si el usuario envía una nueva
                    if (usuario.getPasswordHash() != null && !usuario.getPasswordHash().isBlank()) {
                        String incoming = usuario.getPasswordHash();
                        existing.setPasswordHash(esHashBcrypt(incoming) ? incoming : passwordEncoder.encode(incoming));
                    }
                    return ResponseEntity.ok(usuarioRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private boolean esHashBcrypt(String value) {
        return value != null
                && (value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$"));
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
