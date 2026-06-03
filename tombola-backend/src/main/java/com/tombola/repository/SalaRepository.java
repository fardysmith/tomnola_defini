package com.tombola.repository;

import com.tombola.entity.Sala;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SalaRepository extends JpaRepository<Sala, Long> {
    Optional<Sala> findByCodigo(String codigo);
    List<Sala> findByEstado(Sala.EstadoSala estado);
    List<Sala> findAllByOrderByCreatedAtDesc();
}
