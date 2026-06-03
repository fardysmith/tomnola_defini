package com.tombola.controller;

import com.tombola.dto.WsDTOs.*;
import com.tombola.entity.Sala;
import com.tombola.service.JuegoService;
import com.tombola.service.SalaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/salas")
@RequiredArgsConstructor
public class SalaController {

    private final SalaService salaService;
    private final JuegoService juegoService;

    // ── GET todas las salas activas ──
    @GetMapping("/activas")
    public ResponseEntity<List<Map<String, Object>>> getSalasActivas() {
        List<Map<String, Object>> salas = salaService.obtenerSalasActivas().stream()
                .map(s -> Map.of(
                        "id", s.getId(),
                        "nombre", s.getNombre(),
                        "codigo", s.getCodigo(),
                        "estado", s.getEstado().name(),
                        "maxJugadores", s.getMaxJugadores()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(salas);
    }

    // ── GET todas las salas (admin) ──
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Sala>> getAllSalas() {
        return ResponseEntity.ok(salaService.obtenerTodasLasSalas());
    }

    // ── POST crear sala (admin) ──
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Sala> crearSala(@RequestBody Map<String, Object> body) {
        String nombre = (String) body.getOrDefault("nombre", "Sala Tombola");
        int maxJugadores = (int) body.getOrDefault("maxJugadores", 16);
        int tiempoEspera = (int) body.getOrDefault("tiempoEsperaSegundos", 60);
        int intervaloSorteo = (int) body.getOrDefault("intervaloSorteoSegundos", 5);

        Sala sala = salaService.crearSala(nombre, maxJugadores, tiempoEspera, intervaloSorteo);
        return ResponseEntity.ok(sala);
    }

    // ── POST unirse a sala por código ──
    @PostMapping("/unirse/{codigo}")
    public ResponseEntity<SalaDTO> unirsePorCodigo(
            @PathVariable String codigo,
            @AuthenticationPrincipal UserDetails userDetails) {
        Sala sala = salaService.obtenerSalaPorCodigo(codigo);
        SalaDTO dto = juegoService.unirseASala(sala.getId(), userDetails.getUsername());
        return ResponseEntity.ok(dto);
    }

    // ── POST unirse a sala por ID ──
    @PostMapping("/{id}/unirse")
    public ResponseEntity<SalaDTO> unirsePorId(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        SalaDTO dto = juegoService.unirseASala(id, userDetails.getUsername());
        return ResponseEntity.ok(dto);
    }

    // ── GET estado de sala ──
    @GetMapping("/{id}/estado")
    public ResponseEntity<SalaDTO> getEstado(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Sala sala = salaService.obtenerSalaPorId(id);
        // Buscar usuario por email
        // Simplificado: retorna sala sin cartón personal si no está unido
        SalaDTO dto = juegoService.buildSalaDTO(sala, -1L);
        return ResponseEntity.ok(dto);
    }

    // ── POST reclamar premio ──
    @PostMapping("/{salaId}/reclamar")
    public ResponseEntity<PremioGanado> reclamarPremio(
            @PathVariable Long salaId,
            @RequestBody ReclamarPremioRequest request) {
        PremioGanado resultado = juegoService.reclamarPremio(
                salaId, request.getCartonId(), request.getPremio());
        return ResponseEntity.ok(resultado);
    }
}
