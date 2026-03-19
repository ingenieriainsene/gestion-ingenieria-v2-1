package com.ingenieria.dto.rrhh;

import com.ingenieria.model.rrhh.EmployeeStatus;
import java.util.UUID;

public record EmpleadoResponse(
    UUID id,
    String nombreCompleto,
    String dniNie,
    String puesto,
    EmployeeStatus estado
) {}
