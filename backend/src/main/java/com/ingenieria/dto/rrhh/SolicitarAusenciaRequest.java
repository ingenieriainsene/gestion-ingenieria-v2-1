package com.ingenieria.dto.rrhh;

import com.ingenieria.model.rrhh.AbsenceType;
import java.time.LocalDate;
import java.util.UUID;

public record SolicitarAusenciaRequest(
    UUID empleadoId,
    AbsenceType tipo,
    LocalDate fechaInicio,
    LocalDate fechaFin,
    int diasSolicitados
) {}
