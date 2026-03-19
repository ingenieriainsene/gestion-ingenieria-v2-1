package com.ingenieria.dto.rrhh;

import java.time.LocalDate;

public record CreateEmpleadoRequest(
    String nombreCompleto,
    String dniNie,
    String puesto,
    LocalDate fechaAlta
) {}
