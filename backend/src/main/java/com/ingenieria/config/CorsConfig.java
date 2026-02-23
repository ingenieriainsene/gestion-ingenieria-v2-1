package com.ingenieria.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuración CORS global para el proyecto.
 * Permite peticiones desde el frontend local y el de producción en Railway.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

        @Override
        public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                                .allowedOrigins(
                                                "http://localhost",
                                                "http://localhost:80",
                                                "http://localhost:4200",
                                                "http://127.0.0.1",
                                                "https://pacific-mercy-production-9a82.up.railway.app")
                                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH")
                                .allowedHeaders("*")
                                .exposedHeaders("Authorization", "Content-Disposition")
                                .allowCredentials(true)
                                .maxAge(3600);
        }
}
