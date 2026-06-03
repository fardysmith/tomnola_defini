package com.tombola.repository;

import com.tombola.entity.Carton;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CartonRepository extends JpaRepository<Carton, Long> {
    List<Carton> findBySalaId(Long salaId);
    Optional<Carton> findBySalaIdAndUsuarioId(Long salaId, Long usuarioId);
    boolean existsBySalaIdAndUsuarioId(Long salaId, Long usuarioId);
}
