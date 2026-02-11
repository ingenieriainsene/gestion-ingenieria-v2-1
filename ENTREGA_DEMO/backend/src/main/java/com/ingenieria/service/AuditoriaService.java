package com.ingenieria.service;

import com.ingenieria.model.AuditoriaSistema;
import com.ingenieria.repository.AuditoriaSistemaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditoriaService {

    @Autowired
    private AuditoriaSistemaRepository auditoriaRepository;

    @Transactional(readOnly = true)
    public List<AuditoriaSistema> obtenerTodaAuditoria() {
        return auditoriaRepository.findAllByOrderByFechaCambioDesc();
    }

    /**
     * Registra un cambio en la tabla de auditoría.
     * Equivalente al tracking que hacía el sistema PHP antiguo
     * cuando un usuario autenticado modificaba el estado de un registro.
     */
    @Transactional
    public AuditoriaSistema registrarCambio(String tablaAfectada,
                                            Long idRegistro,
                                            String campoModificado,
                                            String valorAnterior,
                                            String valorNuevo,
                                            String usuarioBd) {

        AuditoriaSistema log = new AuditoriaSistema();
        log.setTablaAfectada(tablaAfectada);
        log.setIdRegistro(idRegistro);
        log.setCampoModificado(campoModificado);
        log.setValorAnterior(valorAnterior);
        log.setValorNuevo(valorNuevo);
        log.setUsuarioBd(usuarioBd);

        return auditoriaRepository.save(log);
    }
}
