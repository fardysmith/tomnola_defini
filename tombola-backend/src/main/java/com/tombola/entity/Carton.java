package com.tombola.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cartones")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Carton {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sala_id", nullable = false)
    private Sala sala;    

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sala_id", nullable = false)
    private Sala sala;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    // 15 números del cartón en 3 filas x 5 cols (guardados como CSV)
    @Column(name = "numeros", nullable = false, length = 200)
    private String numeros;

    // Premios ya ganados
    @Column(name = "premio_ambo")
    private boolean premioAmbo = false;

    @Column(name = "premio_terna")
    private boolean premioTerna = false;

    @Column(name = "premio_quaterna")
    private boolean premioQuaterna = false;

    @Column(name = "premio_quintina")
    private boolean premioQuintina = false;

    @Column(name = "premio_tombola")
    private boolean premioTombola = false;

    // Retorna los 15 números como lista
    public List<Integer> getNumerosList() {
        List<Integer> lista = new ArrayList<>();
        for (String n : numeros.split(",")) {
            lista.add(Integer.parseInt(n.trim()));
        }
        return lista;
    }

    // Retorna los números en 3 filas de 5 (índices 0-4, 5-9, 10-14)
    public List<List<Integer>> getFilas() {
        List<Integer> todos = getNumerosList();
        List<List<Integer>> filas = new ArrayList<>();
        filas.add(todos.subList(0, 5));
        filas.add(todos.subList(5, 10));
        filas.add(todos.subList(10, 15));
        return filas;
    }
}
