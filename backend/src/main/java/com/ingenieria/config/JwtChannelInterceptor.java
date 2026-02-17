package com.ingenieria.config;

import com.ingenieria.config.JwtUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

/**
 * Interceptor para autenticar conexiones WebSocket usando JWT.
 * Valida el token JWT enviado en el header "Authorization" durante el handshake
 * STOMP.
 */
@Slf4j
@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;

    public JwtChannelInterceptor(JwtUtils jwtUtils, UserDetailsService userDetailsService) {
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Obtener el token JWT del header "Authorization"
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);

                try {
                    // Validar el token
                    if (jwtUtils.validateJwtToken(token)) {
                        String username = jwtUtils.getUserNameFromJwtToken(token);
                        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                        // Crear autenticación y establecerla en el contexto
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities());

                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        accessor.setUser(authentication);

                        log.info("[WebSocket] Usuario autenticado: {}", username);
                    } else {
                        log.warn("[WebSocket] Token JWT inválido");
                        throw new IllegalArgumentException("Token JWT inválido");
                    }
                } catch (Exception e) {
                    log.error("[WebSocket] Error al autenticar: {}", e.getMessage());
                    throw new IllegalArgumentException("Error de autenticación: " + e.getMessage());
                }
            } else {
                log.warn("[WebSocket] No se proporcionó token JWT");
                throw new IllegalArgumentException("Se requiere autenticación JWT");
            }
        }

        return message;
    }
}
