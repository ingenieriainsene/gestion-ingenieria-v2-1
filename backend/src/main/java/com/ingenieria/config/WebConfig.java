package com.ingenieria.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuración de CORS a nivel de Spring MVC.
 * Actúa como segunda capa de defensa, independiente de Spring Security.
 *
 * Por qué dos capas:
 * - Spring Security CORS filter → intercepta peticiones ANTES de que lleguen
 * al DispatcherServlet (cubre endpoints de seguridad, preflight, etc.)
 * - WebMvcConfigurer addCorsMappings → aplica cabeceras CORS a nivel MVC,
 * cubre @RestController endpoints aunque el filtro de seguridad no actúe.
 *
 * Origen exacto del frontend en Railway:
 * https://pacific-mercy-production-9a82.up.railway.app
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                // Orígenes explícitos del frontend (producción + desarrollo local)
                .allowedOriginPatterns(
                        "https://pacific-mercy-production-9a82.up.railway.app",
                        "https://*.up.railway.app",
                        "http://localhost:*",
                        "http://127.0.0.1:*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD")
                .allowedHeaders("*")
                .exposedHeaders("Authorization", "Content-Disposition")
                // false porque usamos JWT Bearer (no cookies de sesión)
                .allowCredentials(false)
                .maxAge(3600);
    }
}
