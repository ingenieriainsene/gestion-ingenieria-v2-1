package com.ingenieria.model.rrhh;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "fichajes")
@Data
@NoArgsConstructor
public class Fichaje {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empleado_id", nullable = false)
    private Empleado empleado;

    @Column(nullable = false)
    private LocalDate fecha = LocalDate.now();

    @Column(name = "hora_entrada", nullable = false)
    private LocalTime horaEntrada;

    @Column(name = "hora_salida")
    private LocalTime horaSalida;

    @Column(name = "minutos_pausa")
    private Integer minutosPausa = 0;

    @Column(nullable = false, length = 20)
    private String estado; // TRABAJANDO, EN_PAUSA, FINALIZADO

    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt = ZonedDateTime.now();
    
    // transient fields to hold pause start time to calculate minutes natively if desired later
}
