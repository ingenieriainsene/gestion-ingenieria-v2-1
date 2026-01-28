package com.ingenieria.service;

import com.ingenieria.model.Usuario;
import com.ingenieria.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import java.util.Collections;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    @Autowired
    UsuarioRepository usuarioRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        System.out.println("Buscando usuario: " + username);
        Usuario user = usuarioRepository.findByNombreUsuario(username)
                .orElseThrow(() -> {
                    System.out.println("Usuario NO encontrado en BD: " + username);
                    return new UsernameNotFoundException("User Not Found with username: " + username);
                });

        Usuario.Rol rol = user.getRol() != null ? user.getRol() : Usuario.Rol.LECTURA;

        System.out.println("--- DEBUG LOGIN ---");
        System.out.println("Usuario encontrado: " + user.getNombreUsuario());
        System.out.println("Password Hash en BD: " + user.getPasswordHash());
        System.out.println("-------------------");

        return new org.springframework.security.core.userdetails.User(
                user.getNombreUsuario(),
                user.getPasswordHash(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + rol.name())));
    }
}
