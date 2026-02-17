package com.ingenieria.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configuración de WebSocket con STOMP para chat en tiempo real.
 * 
 * - Endpoint: /ws (con SockJS fallback para compatibilidad)
 * - Application prefix: /app (para mensajes del cliente al servidor)
 * - Topic prefix: /topic (para broadcast público)
 * - Queue prefix: /queue (para mensajes privados usuario a usuario)
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtChannelInterceptor jwtChannelInterceptor;

    public WebSocketConfig(JwtChannelInterceptor jwtChannelInterceptor) {
        this.jwtChannelInterceptor = jwtChannelInterceptor;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint WebSocket con SockJS fallback
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Permitir cualquier origen (Docker, Local, etc.)
                .withSockJS(); // Fallback para navegadores que no soportan WebSocket
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Prefijo para mensajes del cliente al servidor
        registry.setApplicationDestinationPrefixes("/app");

        // Broker simple para mensajes públicos (/topic) y privados (/queue)
        registry.enableSimpleBroker("/topic", "/queue");

        // Prefijo para mensajes privados usuario a usuario
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Añadir interceptor JWT para autenticar conexiones WebSocket
        registration.interceptors(jwtChannelInterceptor);
    }
}
