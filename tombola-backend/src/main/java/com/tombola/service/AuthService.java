package com.tombola.service;

import com.tombola.dto.AuthDTOs.*;
import com.tombola.entity.Usuario;
import com.tombola.repository.UsuarioRepository;
import com.tombola.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    public AuthResponse registrar(RegisterRequest request) {
        // Validar duplicados
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("El email ya está registrado");
        }
        if (usuarioRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("El nombre de usuario ya está en uso");
        }

        // Crear usuario
        Usuario usuario = Usuario.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .rol(Usuario.Rol.JUGADOR)
                .activo(true)
                .build();

        usuarioRepository.save(usuario);

        // Generar token
        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(usuario.getEmail())
                .password(usuario.getPassword())
                .authorities("ROLE_" + usuario.getRol().name())
                .build();

        String token = jwtUtils.generarToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .tipo("Bearer")
                .id(usuario.getId())
                .username(usuario.getUsername())
                .email(usuario.getEmail())
                .rol(usuario.getRol().name())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        // Autenticar credenciales
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(usuario.getEmail())
                .password(usuario.getPassword())
                .authorities("ROLE_" + usuario.getRol().name())
                .build();

        String token = jwtUtils.generarToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .tipo("Bearer")
                .id(usuario.getId())
                .username(usuario.getUsername())
                .email(usuario.getEmail())
                .rol(usuario.getRol().name())
                .build();
    }
}
