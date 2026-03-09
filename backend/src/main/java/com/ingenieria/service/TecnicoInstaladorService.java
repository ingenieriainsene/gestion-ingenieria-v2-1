package com.ingenieria.service;

import com.ingenieria.model.TecnicoInstalador;
import com.ingenieria.repository.TecnicoInstaladorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TecnicoInstaladorService {

    @Autowired
    private TecnicoInstaladorRepository repository;

    @Transactional(readOnly = true)
    public List<TecnicoInstalador> findAll() {
        return repository.findAllByOrderByNombreAsc();
    }

    @Transactional(readOnly = true)
    public List<TecnicoInstalador> findActivos() {
        return repository.findByActivoTrueOrderByNombreAsc();
    }

    @Transactional(readOnly = true)
    public TecnicoInstalador findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Técnico instalador no encontrado: " + id));
    }

    @Transactional
    public TecnicoInstalador save(TecnicoInstalador tecnico) {
        return repository.save(tecnico);
    }

    @Transactional
    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
