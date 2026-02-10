package com.ingenieria.controller;

import com.ingenieria.config.JwtUtils;
import com.ingenieria.dto.LoginRequest;
import com.ingenieria.dto.JwtResponse;
import com.ingenieria.model.Usuario;
import com.ingenieria.repository.UsuarioRepository;
import com.ingenieria.model.AuditoriaSesion;
import com.ingenieria.repository.AuditoriaSesionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UsuarioRepository usuarioRepository;

    @Autowired
    AuditoriaSesionRepository auditoriaSesionRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest,
            jakarta.servlet.http.HttpServletRequest request) {
        System.out.println(
                "Intento de login recibido para: " + (loginRequest != null ? loginRequest.getUsername() : "null"));

        String username = loginRequest != null ? loginRequest.getUsername() : null;
        String password = loginRequest != null ? loginRequest.getPassword() : null;
        log.info("[Auth] /login recibido – username: '{}', password presente: {}", username,
                password != null && !password.isEmpty());

        if ("jefe_admin".equals(username)) {
            usuarioRepository.findByNombreUsuario(username).ifPresentOrElse(
                    u -> log.info("[Auth] jefe_admin existe en BD; hash empieza con BCrypt: {}",
                            u.getPasswordHash() != null && u.getPasswordHash().startsWith("$2")),
                    () -> log.warn("[Auth] jefe_admin NO existe en BD. Ejecuta DataInitializer o crea el usuario."));
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String rol = userDetails.getAuthorities().iterator().next().getAuthority();

            // Auditoría: no debe bloquear el login. Si falla, solo logueamos.
            try {
                Usuario usuario = usuarioRepository.findByNombreUsuario(userDetails.getUsername()).orElse(null);
                if (usuario != null) {
                    String ip = resolveClientIp(request);
                    AuditoriaSesion sesion = new AuditoriaSesion();
                    sesion.setIdUsuario(usuario.getIdUsuario());
                    sesion.setNombreUsuario(usuario.getNombreUsuario());
                    sesion.setIpAcceso(ip);
                    sesion.setEstado("Conectado");
                    auditoriaSesionRepository.save(sesion);
                }
            } catch (Exception auditEx) {
                log.warn("[Auth] No se pudo registrar auditoría de login: {}", auditEx.getMessage());
            }

            return ResponseEntity.ok(new JwtResponse(jwt,
                    userDetails.getUsername(),
                    rol));
        } catch (BadCredentialsException e) {
            log.warn("[Auth] Login fallido (BadCredentials) – usuario: '{}', mensaje: {}", username, e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Usuario o contraseña incorrectos. Verifica jefe_admin / admin123."));
        } catch (Exception e) {
            log.error("[Auth] Error inesperado en /login para usuario '{}'", username, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error al autenticar. Revisa logs del servidor."));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(jakarta.servlet.http.HttpServletRequest request) {
        String username = null;
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetails userDetails) {
            username = userDetails.getUsername();
        }

        if (username != null) {
            usuarioRepository.findByNombreUsuario(username).ifPresent(usuario -> {
                auditoriaSesionRepository
                        .findTopByIdUsuarioAndEstadoOrderByFechaInicioDesc(usuario.getIdUsuario(), "Conectado")
                        .ifPresent(sesion -> {
                            sesion.setEstado("Desconectado");
                            sesion.setFechaFin(java.time.LocalDateTime.now());
                            auditoriaSesionRepository.save(sesion);
                        });
            });
        }

        SecurityContextHolder.clearContext();
        return ResponseEntity.ok().build();
    }

    private String resolveClientIp(jakarta.servlet.http.HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isEmpty()) {
            // puede venir como lista
            return ip.split(",")[0].trim();
        }
        ip = request.getHeader("X-Real-IP");
        if (ip != null && !ip.isEmpty()) {
            return ip;
        }
        ip = request.getRemoteAddr();
        if ("::1".equals(ip) || "localhost".equalsIgnoreCase(ip)) {
            return "127.0.0.1";
        }
        return ip;
    }

    // Endpoint helper to create admin user manually if needed (remove in prod)
    @PostMapping("/setup")
    public ResponseEntity<?> setupAdmin() {
        if (usuarioRepository.findByNombreUsuario("admin").isPresent()) {
            return ResponseEntity.badRequest().body("Admin ya existe");
        }
        Usuario u = new Usuario();
        u.setNombreUsuario("admin");
        u.setPasswordHash(encoder.encode("admin123"));
        u.setRol(Usuario.Rol.ADMIN);
        u.setEmail("admin@admin.com");
        usuarioRepository.save(u);
        return ResponseEntity.ok("Admin creado");
    }
}
