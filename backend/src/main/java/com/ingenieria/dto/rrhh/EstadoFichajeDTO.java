package com.ingenieria.dto.rrhh;

import java.time.LocalTime;

public record EstadoFichajeDTO(
    String estado, // TRABAJANDO, EN_PAUSA, FINALIZADO, SIN_INICIAR
    LocalTime horaEntrada,
    LocalTime horaSalida,
    Integer minutosPausa
) {}
