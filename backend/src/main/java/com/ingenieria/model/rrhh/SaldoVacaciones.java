package com.ingenieria.model.rrhh;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Entity
@Table(name = "saldos_vacaciones", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"empleado_id", "anio"})
})
@Data
@NoArgsConstructor
public class SaldoVacaciones {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empleado_id", nullable = false)
    private Empleado empleado;

    @Column(nullable = false)
    private Integer anio;

    @Column(name = "dias_totales", nullable = false)
    private Integer diasTotales;

    @Column(name = "dias_disfrutados", nullable = false)
    private Integer diasDisfrutados = 0;
}
