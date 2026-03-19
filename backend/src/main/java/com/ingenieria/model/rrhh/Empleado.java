package com.ingenieria.model.rrhh;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "empleados")
@Data
@NoArgsConstructor
public class Empleado {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "auth_user_id")
    private UUID authUserId;

    @Column(name = "nombre_completo", nullable = false)
    private String nombreCompleto;

    @Column(name = "dni_nie", unique = true, nullable = false)
    private String dniNie;

    @Column(name = "fecha_alta", nullable = false)
    private LocalDate fechaAlta;

    @Column(name = "fecha_baja")
    private LocalDate fechaBaja;

    private String puesto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmployeeStatus estado = EmployeeStatus.ACTIVO;
}
