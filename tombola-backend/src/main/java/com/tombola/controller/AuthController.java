package com.tombola.controller;

import com.tombola.dto.AuthDTOs.*;
import com.tombola.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/registro
     * Registro de nuevo jugador
     */
    @PostMapping("/registro")
    public ResponseEntity<AuthResponse> registrar(
            @Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.registrar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * POST /api/auth/login
     * Inicio de sesión
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/auth/verificar
     * Verificar que el token es válido (útil para el frontend)
     */
    @GetMapping("/verificar")
    public ResponseEntity<MensajeResponse> verificar() {
        return ResponseEntity.ok(MensajeResponse.builder()
                .mensaje("Token válido")
                .exito(true)
                .build());
    }
}
