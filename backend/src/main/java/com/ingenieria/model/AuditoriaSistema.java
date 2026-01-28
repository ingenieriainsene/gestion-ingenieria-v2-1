package com.ingenieria.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "AUDITORIA_SISTEMA")
public class AuditoriaSistema {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_log")
    private Long idLog;

    // CORRECCIÓN: El nombre debe coincidir exactamente con el SQL (tabla_afectada)
    @Column(name = "tabla_afectada", nullable = false) 
    private String tablaAfectada; 

    @Column(name = "id_registro", nullable = false)
    private Long idRegistro;

    @Column(name = "campo_modificado")
    private String campoModificado;

    @Column(name = "valor_anterior", columnDefinition = "TEXT")
    private String valorAnterior;

    @Column(name = "valor_nuevo", columnDefinition = "TEXT")
    private String valorNuevo;

    @Column(name = "fecha_cambio", insertable = false, updatable = false)
    private LocalDateTime fechaCambio;

    @Column(name = "usuario_bd")
    private String usuarioBd;
}