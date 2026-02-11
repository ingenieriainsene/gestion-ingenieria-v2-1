package com.ingenieria.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

/**
 * Configuración CORS para permitir peticiones desde el frontend.
 * Soluciona el error de CORS cuando el frontend (puerto 80) hace peticiones al
 * backend (puerto 8082).
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();

        // Permitir credenciales (cookies, headers de autorización, etc.)
        config.setAllowCredentials(true);

        // Orígenes permitidos - Frontend en Docker (puerto 80)
        config.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost",
                "http://localhost:80",
                "http://localhost:4200", // Para desarrollo local
                "http://127.0.0.1",
                "http://127.0.0.1:80",
                "http://127.0.0.1:4200"));

        // Métodos HTTP permitidos
        config.setAllowedMethods(Arrays.asList(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "OPTIONS",
                "PATCH"));

        // Headers permitidos
        config.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "Accept",
                "Origin",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers",
                "X-Requested-With"));

        // Headers expuestos al cliente
        config.setExposedHeaders(Arrays.asList(
                "Authorization",
                "Content-Disposition"));

        // Tiempo de caché para preflight requests (OPTIONS)
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
