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
    public ResponseEntity<?> crearUsuario(@RequestBody Usuario usuario) {
        if (usuario.getIdUsuario() != null) {
            usuario.setIdUsuario(null);
        }
        if (usuario.getDni() == null || !validarDniNie(usuario.getDni())) {
            return ResponseEntity.badRequest().body("DNI/NIE inválido o no proporcionado");
        }
        if (usuario.getPasswordHash() == null || usuario.getPasswordHash().isBlank()) {
            return ResponseEntity.badRequest().body("Password obligatoria");
        }
        if (!esHashBcrypt(usuario.getPasswordHash())) {
            usuario.setPasswordHash(passwordEncoder.encode(usuario.getPasswordHash()));
        }
        Usuario guardado = usuarioRepository.save(usuario);
        return ResponseEntity.ok(guardado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarUsuario(@PathVariable Long id, @RequestBody Usuario usuario) {
        return usuarioRepository.findById(id)
                .map(existing -> {
                    if (usuario.getDni() == null || !validarDniNie(usuario.getDni())) {
                        return ResponseEntity.badRequest().body("DNI/NIE inválido");
                    }
                    existing.setNombreUsuario(usuario.getNombreUsuario());
                    existing.setEmail(usuario.getEmail());
                    existing.setRol(usuario.getRol());
                    existing.setDni(usuario.getDni());
                    // Solo actualiza password si el usuario envía una nueva
                    if (usuario.getPasswordHash() != null && !usuario.getPasswordHash().isBlank()) {
                        String incoming = usuario.getPasswordHash();
                        existing.setPasswordHash(esHashBcrypt(incoming) ? incoming : passwordEncoder.encode(incoming));
                    }
                    return ResponseEntity.ok(usuarioRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private boolean validarDniNie(String input) {
        if (input == null) return false;
        String clean = input.toUpperCase().replaceAll("\\s", "");
        if (clean.matches("^[0-9]{8}[A-Z]$")) {
            String sNúmero = clean.substring(0, 8);
            char letra = clean.charAt(8);
            return "TRWAGMYFPDXBNJZSQVHLCKE".charAt(Integer.parseInt(sNúmero) % 23) == letra;
        } else if (clean.matches("^[XYZ][0-9]{7}[A-Z]$")) {
            String sLetraInicial = clean.substring(0, 1);
            String sNúmero = clean.substring(1, 8);
            char letraFinal = clean.charAt(8);
            String prefix = sLetraInicial.replace("X", "0").replace("Y", "1").replace("Z", "2");
            return "TRWAGMYFPDXBNJZSQVHLCKE".charAt(Integer.parseInt(prefix + sNúmero) % 23) == letraFinal;
        }
        return false;
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
