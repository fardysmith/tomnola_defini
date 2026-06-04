package com.tombola.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
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

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "numeros", nullable = false, length = 200)
    private String numeros;

    @Builder.Default
    @Column(name = "premio_ambo")
    private boolean premioAmbo = false;

    @Builder.Default
    @Column(name = "premio_terna")
    private boolean premioTerna = false;

    @Builder.Default
    @Column(name = "premio_quaterna")
    private boolean premioQuaterna = false;

    @Builder.Default
    @Column(name = "premio_quintina")
    private boolean premioQuintina = false;

    @Builder.Default
    @Column(name = "premio_tombola")
    private boolean premioTombola = false;

    public List<Integer> getNumerosList() {
        List<Integer> lista = new ArrayList<>();
        for (String n : numeros.split(",")) {
            lista.add(Integer.parseInt(n.trim()));
        }
        return lista;
    }

    public List<List<Integer>> getFilas() {
        List<Integer> todos = getNumerosList();
        List<List<Integer>> filas = new ArrayList<>();
        filas.add(todos.subList(0, 5));
        filas.add(todos.subList(5, 10));
        filas.add(todos.subList(10, 15));
        return filas;
    }
}