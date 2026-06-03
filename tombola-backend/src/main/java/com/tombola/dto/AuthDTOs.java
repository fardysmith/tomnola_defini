package com.tombola.dto;

import jakarta.validation.constraints.*;
import lombok.*;

// ─── Request DTOs ────────────────────────────────────────────────

public class AuthDTOs {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class RegisterRequest {
        @NotBlank(message = "El nombre de usuario es obligatorio")
        @Size(min = 3, max = 50, message = "El username debe tener entre 3 y 50 caracteres")
        private String username;

        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El email no es válido")
        private String email;

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
        private String password;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class LoginRequest {
        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El email no es válido")
        private String email;

        @NotBlank(message = "La contraseña es obligatoria")
        private String password;
    }

    // ─── Response DTOs ──────────────────────────────────────────

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AuthResponse {
        private String token;
        private String tipo = "Bearer";
        private Long id;
        private String username;
        private String email;
        private String rol;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MensajeResponse {
        private String mensaje;
        private boolean exito;
    }
}
