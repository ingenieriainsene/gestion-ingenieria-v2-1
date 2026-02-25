package com.ingenieria.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Configuración de Spring Security con CORS integrado en el Security Filter
 * Chain.
 *
 * Por qué este enfoque es el definitivo:
 * Spring Security intercepta las peticiones OPTIONS (preflight) ANTES de que
 * lleguen al DispatcherServlet o a cualquier filtro de servlet ordinario.
 * Si CORS no está configurado dentro del Security Filter Chain, Spring Security
 * rechaza los preflights antes de que el filtro CORS pueda añadir las
 * cabeceras.
 *
 * Al pasar el CorsConfigurationSource directamente a http.cors(...), Spring
 * Security
 * aplica la política CORS en su propio filtro (CorsFilter registrado en la
 * cadena de
 * seguridad), garantizando que OPTIONS siempre recibe las cabeceras correctas.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // CORS integrado en el Security Filter Chain - única fuente de verdad
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Preflights OPTIONS siempre permitidos explícitamente
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .anyRequest().permitAll());
        return http.build();
    }

    @Bean
    public org.springframework.security.authentication.AuthenticationManager authenticationManager(
            org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration configuration)
            throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Fuente de configuración CORS — única en toda la aplicación.
     *
     * Usa allowedOriginPatterns (no allowedOrigins) para poder combinar
     * allowCredentials(true) con patrones de origen, lo que es necesario
     * para que el navegador acepte la respuesta y envíe la cabecera Authorization.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Orígenes exactos y patrones permitidos
        // allowedOriginPatterns es compatible con allowCredentials(true)
        config.setAllowedOriginPatterns(Arrays.asList(
                "https://pacific-mercy-production-9a82.up.railway.app",
                "https://*.up.railway.app",
                "http://localhost:*",
                "http://127.0.0.1:*"));

        config.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"));

        // Todas las cabeceras permitidas (incluida Authorization para JWT)
        config.setAllowedHeaders(List.of("*"));

        // Cabeceras que el cliente puede leer
        config.setExposedHeaders(Arrays.asList("Authorization", "Content-Disposition"));

        // true: necesario para que el navegador acepte respuestas con cabeceras como
        // Authorization
        config.setAllowCredentials(true);

        // Cachear el resultado del preflight 1 hora
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
