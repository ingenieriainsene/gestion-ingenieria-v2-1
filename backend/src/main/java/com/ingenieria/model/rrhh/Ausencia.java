package com.ingenieria.model.rrhh;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "ausencias")
@Data
@NoArgsConstructor
public class Ausencia {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empleado_id", nullable = false)
    private Empleado empleado;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AbsenceType tipo;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDate fechaFin;

    @Column(name = "dias_solicitados", nullable = false)
    private Integer diasSolicitados;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AbsenceStatus estado = AbsenceStatus.PENDIENTE;

    @Column(name = "solicitado_at", nullable = false, updatable = false)
    private ZonedDateTime solicitadoAt = ZonedDateTime.now();
}
