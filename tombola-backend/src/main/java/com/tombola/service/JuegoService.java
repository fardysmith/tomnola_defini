package com.tombola.service;

import com.tombola.dto.WsDTOs.*;
import com.tombola.entity.*;
import com.tombola.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class JuegoService {

    private final SalaRepository salaRepository;
    private final CartonRepository cartonRepository;
    private final UsuarioRepository usuarioRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final TaskScheduler taskScheduler;

    // Mapa de tareas programadas por sala
    private final Map<Long, ScheduledFuture<?>> tareasContador = new ConcurrentHashMap<>();
    private final Map<Long, ScheduledFuture<?>> tareasJuego = new ConcurrentHashMap<>();
    private final Map<Long, Integer> contadoresSegundos = new ConcurrentHashMap<>();

    // ──────────────────────────────────────────────
    // UNIRSE A SALA
    // ──────────────────────────────────────────────
    @Transactional
    public SalaDTO unirseASala(Long salaId, String emailUsuario) {
        Sala sala = salaRepository.findById(salaId)
                .orElseThrow(() -> new IllegalArgumentException("Sala no encontrada"));

        if (sala.getEstado() == Sala.EstadoSala.FINALIZADA) {
            throw new IllegalStateException("La partida ya terminó");
        }
        if (sala.getEstado() == Sala.EstadoSala.EN_JUEGO) {
            throw new IllegalStateException("La sala está bloqueada, la partida ya comenzó");
        }

        Usuario usuario = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        // Crear cartón si no existe
        if (!cartonRepository.existsBySalaIdAndUsuarioId(salaId, usuario.getId())) {
            Carton carton = Carton.builder()
                    .sala(sala)
                    .usuario(usuario)
                    .numeros(generarCarton())
                    .build();
            cartonRepository.save(carton);
        }

        // Notificar a todos en la sala
        int jugadores = cartonRepository.findBySalaId(salaId).size();
        messagingTemplate.convertAndSend("/topic/sala/" + salaId + "/jugadores",
                JugadorConectado.builder()
                        .username(usuario.getUsername())
                        .totalJugadores(jugadores)
                        .build());
        // Enviar estado actual al jugador que se acaba de unir
        Integer segundosRestantes = contadoresSegundos.getOrDefault(salaId, 0);
        messagingTemplate.convertAndSend("/topic/sala/" + salaId + "/estado",
        EstadoSalaMsg.builder()
                .salaId(salaId)
                .estado(sala.getEstado().name())
                .segundosRestantes(segundosRestantes)
                .jugadoresConectados(cartonRepository.findBySalaId(salaId).size() + 1)
                .build());

        return buildSalaDTO(sala, usuario.getId());
    }

    // ──────────────────────────────────────────────
    // INICIAR CUENTA REGRESIVA (llamado al crear sala)
    // ──────────────────────────────────────────────
    @Transactional
    public void iniciarCuentaRegresiva(Long salaId) {
        Sala sala = salaRepository.findById(salaId).orElseThrow();
        int segundos = sala.getTiempoEsperaSegundos();
        contadoresSegundos.put(salaId, segundos);

        ScheduledFuture<?> tarea = taskScheduler.scheduleAtFixedRate(() -> {
            int restantes = contadoresSegundos.merge(salaId, -1, Integer::sum);

            messagingTemplate.convertAndSend("/topic/sala/" + salaId + "/estado",
                    EstadoSalaMsg.builder()
                            .salaId(salaId)
                            .estado("ESPERANDO")
                            .segundosRestantes(restantes)
                            .jugadoresConectados(cartonRepository.findBySalaId(salaId).size())
                            .build());

            if (restantes <= 0) {
                cancelarTarea(tareasContador, salaId);
                iniciarJuego(salaId);
            }
        }, Instant.now(), java.time.Duration.ofSeconds(1));

        tareasContador.put(salaId, tarea);
    }

    // ──────────────────────────────────────────────
    // INICIAR JUEGO
    // ──────────────────────────────────────────────
    @Transactional
    public void iniciarJuego(Long salaId) {
        Sala sala = salaRepository.findById(salaId).orElseThrow();

        if (cartonRepository.findBySalaId(salaId).isEmpty()) {
            log.warn("Sala {} sin jugadores, no se inicia", salaId);
            return;
        }

        sala.setEstado(Sala.EstadoSala.EN_JUEGO);
        sala.setInicioAt(java.time.LocalDateTime.now());
        salaRepository.save(sala);

        messagingTemplate.convertAndSend("/topic/sala/" + salaId + "/estado",
                EstadoSalaMsg.builder()
                        .salaId(salaId)
                        .estado("EN_JUEGO")
                        .segundosRestantes(0)
                        .jugadoresConectados(cartonRepository.findBySalaId(salaId).size())
                        .build());

        log.info("Sala {} iniciada", salaId);

        // Sorteo automático cada N segundos
        ScheduledFuture<?> tareaJuego = taskScheduler.scheduleAtFixedRate(() -> {
            sortearNumero(salaId);
        }, Instant.now().plusSeconds(2), java.time.Duration.ofSeconds(sala.getIntervaloSorteoSegundos()));

        tareasJuego.put(salaId, tareaJuego);
    }

    // ──────────────────────────────────────────────
    // SORTEAR NÚMERO
    // ──────────────────────────────────────────────
    @Transactional
    public void sortearNumero(Long salaId) {
        Sala sala = salaRepository.findById(salaId).orElseThrow();

        if (sala.getEstado() != Sala.EstadoSala.EN_JUEGO) {
            cancelarTarea(tareasJuego, salaId);
            return;
        }

        List<Integer> sorteados = sala.getNumerosSorteadosList();

        if (sorteados.size() >= 90) {
            finalizarJuego(salaId, "Se sortearon todos los números");
            return;
        }

        // Elegir número no sorteado
        List<Integer> disponibles = new ArrayList<>();
        for (int i = 1; i <= 90; i++) {
            if (!sorteados.contains(i)) disponibles.add(i);
        }
        Collections.shuffle(disponibles);
        int numero = disponibles.get(0);

        sala.agregarNumeroSorteado(numero);
        salaRepository.save(sala);

        log.info("Sala {} - Número sorteado: {}", salaId, numero);

        messagingTemplate.convertAndSend("/topic/sala/" + salaId + "/numero",
                NumeroSorteado.builder()
                        .numero(numero)
                        .totalSorteados(sorteados.size() + 1)
                        .totalNumeros(90)
                        .build());
    }

    // ──────────────────────────────────────────────
    // RECLAMAR PREMIO
    // ──────────────────────────────────────────────
    @Transactional
    public PremioGanado reclamarPremio(Long salaId, Long cartonId, String tipoPremio) {
        Sala sala = salaRepository.findById(salaId).orElseThrow();
        Carton carton = cartonRepository.findById(cartonId).orElseThrow();

        if (sala.getEstado() != Sala.EstadoSala.EN_JUEGO) {
            return PremioGanado.builder().valido(false).mensaje("La sala no está en juego").build();
        }

        List<Integer> sorteados = sala.getNumerosSorteadosList();
        List<List<Integer>> filas = carton.getFilas();

        boolean valido = validarPremio(filas, sorteados, tipoPremio, carton);

        PremioGanado resultado = PremioGanado.builder()
                .cartonId(cartonId)
                .username(carton.getUsuario().getUsername())
                .premio(tipoPremio)
                .valido(valido)
                .mensaje(valido ? "¡" + tipoPremio + " válido!" : "Premio no válido todavía")
                .build();

        if (valido) {
            cartonRepository.save(carton);
            messagingTemplate.convertAndSend("/topic/sala/" + salaId + "/premios", resultado);

            if (tipoPremio.equals("TOMBOLA")) {
                finalizarJuego(salaId, "¡" + carton.getUsuario().getUsername() + " ganó la Tombola!");
            }
        }

        return resultado;
    }

    // ──────────────────────────────────────────────
    // VALIDAR PREMIO
    // ──────────────────────────────────────────────
    private boolean validarPremio(List<List<Integer>> filas, List<Integer> sorteados,
                                   String tipo, Carton carton) {
        return switch (tipo) {
            case "AMBO" -> {
                if (carton.isPremioAmbo()) yield false;
                boolean ok = filas.stream().anyMatch(f -> contarMarcados(f, sorteados) >= 2);
                if (ok) carton.setPremioAmbo(true);
                yield ok;
            }
            case "TERNA" -> {
                if (carton.isPremioTerna()) yield false;
                boolean ok = filas.stream().anyMatch(f -> contarMarcados(f, sorteados) >= 3);
                if (ok) carton.setPremioTerna(true);
                yield ok;
            }
            case "QUATERNA" -> {
                if (carton.isPremioQuaterna()) yield false;
                boolean ok = filas.stream().anyMatch(f -> contarMarcados(f, sorteados) >= 4);
                if (ok) carton.setPremioQuaterna(true);
                yield ok;
            }
            case "QUINTINA" -> {
                if (carton.isPremioQuintina()) yield false;
                boolean ok = filas.stream().anyMatch(f -> contarMarcados(f, sorteados) >= 5);
                if (ok) carton.setPremioQuintina(true);
                yield ok;
            }
            case "TOMBOLA" -> {
                if (carton.isPremioTombola()) yield false;
                boolean ok = carton.getNumerosList().stream().allMatch(sorteados::contains);
                if (ok) carton.setPremioTombola(true);
                yield ok;
            }
            default -> false;
        };
    }

    private long contarMarcados(List<Integer> fila, List<Integer> sorteados) {
        return fila.stream().filter(sorteados::contains).count();
    }

    // ──────────────────────────────────────────────
    // FINALIZAR JUEGO
    // ──────────────────────────────────────────────
    @Transactional
    public void finalizarJuego(Long salaId, String motivo) {
        cancelarTarea(tareasJuego, salaId);

        Sala sala = salaRepository.findById(salaId).orElseThrow();
        sala.setEstado(Sala.EstadoSala.FINALIZADA);
        sala.setFinAt(java.time.LocalDateTime.now());
        salaRepository.save(sala);

        messagingTemplate.convertAndSend("/topic/sala/" + salaId + "/estado",
                EstadoSalaMsg.builder()
                        .salaId(salaId)
                        .estado("FINALIZADA")
                        .segundosRestantes(0)
                        .jugadoresConectados(cartonRepository.findBySalaId(salaId).size())
                        .build());

        log.info("Sala {} finalizada: {}", salaId, motivo);
    }

    // ──────────────────────────────────────────────
    // GENERAR CARTÓN
    // ──────────────────────────────────────────────
    private String generarCarton() {
        // 3 filas x 9 columnas (décadas), 5 números por fila = 15 total
        List<Integer> numeros = new ArrayList<>();
        Random rnd = new Random();

        // Por cada fila elegimos 5 números de columnas distintas
        for (int fila = 0; fila < 3; fila++) {
            List<Integer> columnas = new ArrayList<>(Arrays.asList(0,1,2,3,4,5,6,7,8));
            Collections.shuffle(columnas);
            List<Integer> columnasElegidas = columnas.subList(0, 5);
            Collections.sort(columnasElegidas);

            for (int col : columnasElegidas) {
                int min = col == 0 ? 1 : col * 10;
                int max = col == 8 ? 90 : col * 10 + 9;
                numeros.add(min + rnd.nextInt(max - min + 1));
            }
        }

        return numeros.stream().map(String::valueOf).collect(Collectors.joining(","));
    }

    // ──────────────────────────────────────────────
    // HELPERS
    // ──────────────────────────────────────────────
    private void cancelarTarea(Map<Long, ScheduledFuture<?>> mapa, Long salaId) {
        ScheduledFuture<?> tarea = mapa.remove(salaId);
        if (tarea != null && !tarea.isCancelled()) tarea.cancel(false);
    }

    public SalaDTO buildSalaDTO(Sala sala, Long usuarioId) {
        List<Carton> cartones = cartonRepository.findBySalaId(sala.getId());
        CartonDTO miCarton = cartones.stream()
                .filter(c -> c.getUsuario().getId().equals(usuarioId))
                .findFirst()
                .map(this::toCartonDTO)
                .orElse(null);

        return SalaDTO.builder()
                .id(sala.getId())
                .nombre(sala.getNombre())
                .codigo(sala.getCodigo())
                .estado(sala.getEstado().name())
                .jugadoresConectados(cartones.size())
                .maxJugadores(sala.getMaxJugadores())
                .tiempoEsperaSegundos(sala.getTiempoEsperaSegundos())
                .numerosSorteados(sala.getNumerosSorteadosList())
                .miCarton(miCarton)
                .build();
    }

    private CartonDTO toCartonDTO(Carton c) {
        return CartonDTO.builder()
                .id(c.getId())
                .filas(c.getFilas())
                .numerosPlanos(c.getNumerosList())
                .premioAmbo(c.isPremioAmbo())
                .premioTerna(c.isPremioTerna())
                .premioQuaterna(c.isPremioQuaterna())
                .premioQuintina(c.isPremioQuintina())
                .premioTombola(c.isPremioTombola())
                .build();
    }
}
