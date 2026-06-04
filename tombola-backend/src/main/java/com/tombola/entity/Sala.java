package com.tombola.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "salas")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Sala {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, unique = true, length = 10)
    private String codigo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoSala estado = EstadoSala.ESPERANDO;

    @Column(name = "max_jugadores")
    private int maxJugadores = 16;

    @Column(name = "tiempo_espera_segundos")
    private int tiempoEsperaSegundos = 60;

    @Column(name = "intervalo_sorteo_segundos")
    private int intervaloSorteoSegundos = 5;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "inicio_at")
    private LocalDateTime inicioAt;

    @Column(name = "fin_at")
    private LocalDateTime finAt;

    // Números ya sorteados (guardados como CSV)
    @Column(name = "numeros_sorteados", length = 500)
    private String numerosSorteados = "";

    @JsonIgnore
    @OneToMany(mappedBy = "sala", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Carton> cartones = new ArrayList<>();

    @OneToMany(mappedBy = "sala", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Carton> cartones = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public List<Integer> getNumerosSorteadosList() {
        if (numerosSorteados == null || numerosSorteados.isBlank()) return new ArrayList<>();
        List<Integer> lista = new ArrayList<>();
        for (String n : numerosSorteados.split(",")) {
            if (!n.isBlank()) lista.add(Integer.parseInt(n.trim()));
        }
        return lista;
    }

    public void agregarNumeroSorteado(int numero) {
        if (numerosSorteados == null || numerosSorteados.isBlank()) {
            this.numerosSorteados = String.valueOf(numero);
        } else {
            this.numerosSorteados += "," + numero;
        }
    }

    public enum EstadoSala {
        ESPERANDO, EN_JUEGO, FINALIZADA
    }
}
