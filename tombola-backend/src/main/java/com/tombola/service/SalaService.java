package com.tombola.service;

import com.tombola.dto.WsDTOs.SalaDTO;
import com.tombola.entity.Sala;
import com.tombola.repository.SalaRepository;
import com.tombola.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SalaService {

    private final SalaRepository salaRepository;
    private final UsuarioRepository usuarioRepository;
    private final JuegoService juegoService;

    @Transactional
    public Sala crearSala(String nombre, int maxJugadores, int tiempoEspera, int intervaloSorteo) {
        Sala sala = Sala.builder()
                .nombre(nombre)
                .codigo(generarCodigo())
                .maxJugadores(maxJugadores)
                .tiempoEsperaSegundos(tiempoEspera)
                .intervaloSorteoSegundos(intervaloSorteo)
                .estado(Sala.EstadoSala.ESPERANDO)
                .build();

        sala = salaRepository.save(sala);

        // Iniciar cuenta regresiva automáticamente
        juegoService.iniciarCuentaRegresiva(sala.getId());

        return sala;
    }

    public List<Sala> obtenerTodasLasSalas() {
        return salaRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Sala> obtenerSalasActivas() {
        return salaRepository.findByEstado(Sala.EstadoSala.ESPERANDO);
    }

    public Sala obtenerSalaPorCodigo(String codigo) {
        return salaRepository.findByCodigo(codigo)
                .orElseThrow(() -> new IllegalArgumentException("Sala no encontrada con código: " + codigo));
    }

    public Sala obtenerSalaPorId(Long id) {
        return salaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sala no encontrada"));
    }

    private String generarCodigo() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random rnd = new Random();
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) sb.append(chars.charAt(rnd.nextInt(chars.length())));
        String codigo = sb.toString();
        // Verificar unicidad
        if (salaRepository.findByCodigo(codigo).isPresent()) return generarCodigo();
        return codigo;
    }
}
