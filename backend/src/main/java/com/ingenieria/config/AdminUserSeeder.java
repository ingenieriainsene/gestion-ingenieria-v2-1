package com.ingenieria.config;

import com.ingenieria.model.Usuario;
import com.ingenieria.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.env.Environment;
import org.springframework.dao.DataAccessException;

@Component
@ConditionalOnProperty(prefix = "app.seed", name = "admin", havingValue = "true", matchIfMissing = false)
public class AdminUserSeeder implements CommandLineRunner {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private Environment env;

    @Override
    public void run(String... args) {
        boolean enabled = Boolean.parseBoolean(env.getProperty("app.seed.admin", "false"));
        if (!enabled) {
            System.out.println(">>> Seeder desactivado (app.seed.admin=false) <<<");
            return;
        }

        System.err.println("!!! SEEDER EJECUTADO !!!");

        System.out.println(">>> INICIANDO SEEDER DE USUARIO ADMIN <<<");
        String username = "jefe_admin";

        try {
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
        } catch (DataAccessException e) {
            System.err.println(">>> AVISO: Seeder omitido por falta de permisos en BD <<<");
            System.err.println(">>> Detalle: " + e.getMostSpecificCause().getMessage());
        }
    }
}
