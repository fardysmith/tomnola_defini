package com.tombola.dto;

import lombok.*;
import java.util.List;

public class WsDTOs {

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class NumeroSorteado {
        private int numero;
        private int totalSorteados;
        private int totalNumeros; // siempre 90
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class EstadoSalaMsg {
        private Long salaId;
        private String estado; // ESPERANDO, EN_JUEGO, FINALIZADA
        private int jugadoresConectados;
        private int segundosRestantes; // para countdown
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PremioGanado {
        private Long cartonId;
        private String username;
        private String premio; // AMBO, TERNA, QUATERNA, QUINTINA, TOMBOLA
        private boolean valido;
        private String mensaje;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class JugadorConectado {
        private String username;
        private int totalJugadores;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ReclamarPremioRequest {
        private Long cartonId;
        private String premio; // AMBO, TERNA, QUATERNA, QUINTINA, TOMBOLA
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CartonDTO {
        private Long id;
        private List<List<Integer>> filas;
        private List<Integer> numerosPlanos;
        private boolean premioAmbo;
        private boolean premioTerna;
        private boolean premioQuaterna;
        private boolean premioQuintina;
        private boolean premioTombola;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SalaDTO {
        private Long id;
        private String nombre;
        private String codigo;
        private String estado;
        private int jugadoresConectados;
        private int maxJugadores;
        private int tiempoEsperaSegundos;
        private List<Integer> numerosSorteados;
        private CartonDTO miCarton;
    }
}
