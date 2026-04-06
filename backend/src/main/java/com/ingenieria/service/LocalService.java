package com.ingenieria.service;

import com.ingenieria.dto.LocalRequest;
import com.ingenieria.model.Cliente;
import com.ingenieria.model.Local;
import com.ingenieria.repository.ClienteRepository;
import com.ingenieria.repository.LocalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LocalService {
    @Autowired
    private LocalRepository localRepository;
    @Autowired
    private ClienteRepository clienteRepository;

    @Transactional(readOnly = true)
    public List<Local> findAll() {
        return localRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Local findById(Long id) {
        return localRepository.findById(id).orElseThrow(() -> new RuntimeException("Local no encontrado: " + id));
    }

    @Transactional(readOnly = true)
    public Local findByReferenciaCatastral(String rc) {
        return localRepository.findByReferenciaCatastral(rc).orElse(null);
    }

    public Local save(Local local) {
        return localRepository.save(local);
    }

    @Transactional
    public Local createFromRequest(LocalRequest req) {
        if (req.getNombreTitular() == null || req.getNombreTitular().isBlank())
            throw new IllegalArgumentException("nombreTitular es obligatorio");
        if (req.getApellido1Titular() == null || req.getApellido1Titular().isBlank())
            throw new IllegalArgumentException("apellido1Titular es obligatorio");
        if (req.getDireccionCompleta() == null || req.getDireccionCompleta().isBlank())
            throw new IllegalArgumentException("direccionCompleta es obligatorio");
        if (req.getReferenciaCatastral() == null || req.getReferenciaCatastral().isBlank())
            throw new IllegalArgumentException("referenciaCatastral es obligatorio");
        Cliente c = null;
        if (req.getIdCliente() != null) {
            c = clienteRepository.findById(req.getIdCliente())
                    .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado: " + req.getIdCliente()));
        }
        if (req.getReferenciaCatastral() != null && !req.getReferenciaCatastral().isBlank()) {
            localRepository.findByReferenciaCatastral(req.getReferenciaCatastral())
                    .ifPresent(existing -> {
                        throw new IllegalArgumentException(
                                "Ya existe un local con la Referencia Catastral: " + req.getReferenciaCatastral());
                    });
        }
        Local l = new Local();
        l.setCliente(c);
        mapRequestToLocal(req, l);
        return localRepository.save(l);
    }

    @Transactional
    public Local updateFromRequest(Long id, LocalRequest req) {
        Local l = localRepository.findById(id).orElseThrow(() -> new RuntimeException("Local no encontrado: " + id));
        if (req.getReferenciaCatastral() == null || req.getReferenciaCatastral().isBlank())
            throw new IllegalArgumentException("referenciaCatastral es obligatorio");
        if (req.getIdCliente() != null) {
            if (!req.getIdCliente().equals(l.getCliente() != null ? l.getCliente().getIdCliente() : null)) {
                Cliente c = clienteRepository.findById(req.getIdCliente())
                        .orElseThrow(
                                () -> new IllegalArgumentException("Cliente no encontrado: " + req.getIdCliente()));
                l.setCliente(c);
            }
        } else {
            l.setCliente(null);
        }
        if (req.getReferenciaCatastral() != null && !req.getReferenciaCatastral().isBlank()) {
            localRepository.findByReferenciaCatastral(req.getReferenciaCatastral())
                    .ifPresent(existing -> {
                        if (!existing.getIdLocal().equals(id)) {
                            throw new IllegalArgumentException(
                                    "Ya existe otro local con la Referencia Catastral: "
                                            + req.getReferenciaCatastral());
                        }
                    });
        }
        mapRequestToLocal(req, l);
        return localRepository.save(l);
    }

    private void mapRequestToLocal(LocalRequest req, Local l) {
        if (req.getNombreTitular() != null)
            l.setNombreTitular(req.getNombreTitular());
        if (req.getApellido1Titular() != null)
            l.setApellido1Titular(req.getApellido1Titular());
        l.setApellido2Titular(
                req.getApellido2Titular() != null && !req.getApellido2Titular().isBlank() ? req.getApellido2Titular()
                        : null);
        if (req.getDireccionCompleta() != null)
            l.setDireccionCompleta(req.getDireccionCompleta());
        l.setCodigoPostal(req.getCodigoPostal());
        l.setLocalidad(req.getLocalidad());
        l.setProvincia(req.getProvincia());
        l.setCups(req.getCups() != null && !req.getCups().isBlank() ? req.getCups() : null);
        l.setReferenciaCatastral(req.getReferenciaCatastral() != null && !req.getReferenciaCatastral().isBlank()
                ? req.getReferenciaCatastral()
                : null);
    }

    public void delete(Long id) {
        localRepository.deleteById(id);
    }
}
