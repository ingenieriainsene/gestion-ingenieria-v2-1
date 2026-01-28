package com.ingenieria.config;

import com.ingenieria.model.Usuario;
import com.ingenieria.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminUserSeeder implements CommandLineRunner {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        System.err.println("!!! SEEDER EJECUTADO !!!");

        System.out.println(">>> INICIANDO SEEDER DE USUARIO ADMIN <<<");
        String username = "jefe_admin";

        Usuario admin = usuarioRepository.findByNombreUsuario(username).orElse(null);
        if (admin == null) {
            admin = new Usuario();
            admin.setNombreUsuario(username);
            admin.setEmail("admin@ingenieria.com");
            admin.setFechaCreacion(java.time.LocalDateTime.now());
            System.out.println(">>> CREANDO NUEVO USUARIO: " + username);
        } else {
            System.out.println(">>> USUARIO ENCONTRADO. ACTUALIZANDO CONTRASEÑA...");
        }

        admin.setPasswordHash(passwordEncoder.encode("admin123"));
        admin.setRol(Usuario.Rol.ADMIN);

        usuarioRepository.save(admin);
        System.out.println(">>> ÉXITO: CREDENCIALES DE 'jefe_admin' RESTABLECIDAS A 'admin123' (BCrypt) <<<");
    }
}
