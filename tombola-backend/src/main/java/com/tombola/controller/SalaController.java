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

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/salas")
@RequiredArgsConstructor
public class SalaController {

    private final SalaService salaService;
    private final JuegoService juegoService;

    @GetMapping("/activas")
    public ResponseEntity<List<Map<String, Object>>> getSalasActivas() {
        List<Map<String, Object>> salas = salaService.obtenerSalasActivas().stream()
                .map(s -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", s.getId());
                    m.put("nombre", s.getNombre());
                    m.put("codigo", s.getCodigo());
                    m.put("estado", s.getEstado().name());
                    m.put("maxJugadores", s.getMaxJugadores());
                    return m;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(salas);
    }

    @GetMapping
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<List<Map<String, Object>>> getAllSalas() {
    List<Map<String, Object>> resultado = salaService.obtenerTodasLasSalas().stream()
            .map(s -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", s.getId());
                m.put("nombre", s.getNombre());
                m.put("codigo", s.getCodigo());
                m.put("estado", s.getEstado().name());
                m.put("maxJugadores", s.getMaxJugadores());
                m.put("tiempoEsperaSegundos", s.getTiempoEsperaSegundos());
                m.put("intervaloSorteoSegundos", s.getIntervaloSorteoSegundos());
                m.put("createdAt", s.getCreatedAt());
                m.put("numerosSorteados", s.getNumerosSorteados());
                m.put("numerosSorteadosList", s.getNumerosSorteadosList());
                return m;
            })
            .collect(Collectors.toList());
    return ResponseEntity.ok(resultado);
}

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

    @PostMapping("/unirse/{codigo}")
    public ResponseEntity<SalaDTO> unirsePorCodigo(
            @PathVariable String codigo,
            @AuthenticationPrincipal UserDetails userDetails) {
        Sala sala = salaService.obtenerSalaPorCodigo(codigo);
        SalaDTO dto = juegoService.unirseASala(sala.getId(), userDetails.getUsername());
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/{id}/unirse")
    public ResponseEntity<SalaDTO> unirsePorId(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        SalaDTO dto = juegoService.unirseASala(id, userDetails.getUsername());
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{id}/estado")
    public ResponseEntity<SalaDTO> getEstado(@PathVariable Long id) {
        Sala sala = salaService.obtenerSalaPorId(id);
        SalaDTO dto = juegoService.buildSalaDTO(sala, -1L);
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/{salaId}/reclamar")
    public ResponseEntity<PremioGanado> reclamarPremio(
            @PathVariable Long salaId,
            @RequestBody ReclamarPremioRequest request) {
        PremioGanado resultado = juegoService.reclamarPremio(
                salaId, request.getCartonId(), request.getPremio());
        return ResponseEntity.ok(resultado);
    }
}
