package com.ingenieria.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * Filtro CORS de máxima prioridad.
 *
 * Se registra como un filtro de servlet ordinario con
 * Ordered.HIGHEST_PRECEDENCE,
 * por lo que se ejecuta ANTES que Spring Security y antes del
 * DispatcherServlet.
 * Esto garantiza que las respuestas a los preflights OPTIONS siempre lleven las
 * cabeceras correctas, independientemente del estado de la cadena de seguridad.
 *
 * Origen exacto del frontend:
 * https://pacific-mercy-production-9a82.up.railway.app
 */
@Configuration
public class CorsFilterConfig {

    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilterRegistrationBean() {
        CorsConfiguration config = new CorsConfiguration();

        // Permitimos explícitamente el dominio del frontend en Railway y localhost
        config.addAllowedOrigin("https://pacific-mercy-production-9a82.up.railway.app");
        config.addAllowedOriginPattern("https://*.up.railway.app");
        config.addAllowedOriginPattern("http://localhost:*");
        config.addAllowedOriginPattern("http://127.0.0.1:*");

        // Todos los métodos necesarios (incluido OPTIONS para el preflight)
        config.addAllowedMethod("GET");
        config.addAllowedMethod("POST");
        config.addAllowedMethod("PUT");
        config.addAllowedMethod("DELETE");
        config.addAllowedMethod("PATCH");
        config.addAllowedMethod("OPTIONS");
        config.addAllowedMethod("HEAD");

        // Todas las cabeceras
        config.addAllowedHeader("*");
        config.addExposedHeader("Authorization");
        config.addExposedHeader("Content-Disposition");

        // La app usa JWT Bearer (no cookies) → credentials = false
        // Esto permite usar allowedOrigin("*") patterns sin restricción
        config.setAllowCredentials(false);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        FilterRegistrationBean<CorsFilter> bean = new FilterRegistrationBean<>(new CorsFilter(source));
        // HIGHEST_PRECEDENCE = se ejecuta antes que cualquier otro filtro (incluido
        // Spring Security)
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return bean;
    }
}
