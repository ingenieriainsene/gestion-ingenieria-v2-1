package com.ingenieria.service;

import com.ingenieria.dto.ContratoRequest;
import com.ingenieria.model.Cliente;
import com.ingenieria.model.Contrato;
import com.ingenieria.model.Local;
import com.ingenieria.repository.ClienteRepository;
import com.ingenieria.repository.ContratoRepository;
import com.ingenieria.repository.LocalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class ContratoService {
    @Autowired private ContratoRepository contratoRepository;
    @Autowired private ClienteRepository clienteRepository;
    @Autowired private LocalRepository localRepository;

    @Transactional(readOnly = true)
    public List<Contrato> findAll() { return contratoRepository.findAll(); }

    @Transactional(readOnly = true)
    public Contrato findById(Long id) { return contratoRepository.findById(id).orElseThrow(); }

    public Contrato save(Contrato contrato) { return contratoRepository.save(contrato); }

    public void delete(Long id) { contratoRepository.deleteById(id); }

    public Contrato createFromRequest(ContratoRequest req) {
        validarFechas(req.getFechaInicio(), req.getFechaVencimiento());

        Cliente cliente = clienteRepository.findById(req.getIdCliente())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no válido"));
        Local local = localRepository.findById(req.getIdLocal())
                .orElseThrow(() -> new IllegalArgumentException("Local no válido"));

        Contrato c = new Contrato();
        c.setCliente(cliente);
        c.setLocal(local);
        aplicarCampos(c, req);
        c.setCreadoPor(getUsuarioActual());
        return contratoRepository.save(c);
    }

    public Contrato updateFromRequest(Long idContrato, ContratoRequest req) {
        validarFechas(req.getFechaInicio(), req.getFechaVencimiento());

        Contrato c = contratoRepository.findById(idContrato).orElseThrow();

        if (req.getIdCliente() != null) {
            Cliente cliente = clienteRepository.findById(req.getIdCliente())
                    .orElseThrow(() -> new IllegalArgumentException("Cliente no válido"));
            c.setCliente(cliente);
        }
        if (req.getIdLocal() != null) {
            Local local = localRepository.findById(req.getIdLocal())
                    .orElseThrow(() -> new IllegalArgumentException("Local no válido"));
            c.setLocal(local);
        }

        aplicarCampos(c, req);
        c.setModificadoPor(getUsuarioActual());
        return contratoRepository.save(c);
    }

    private void aplicarCampos(Contrato c, ContratoRequest req) {
        c.setTipoContrato(req.getTipoContrato());
        c.setFechaInicio(req.getFechaInicio());
        c.setFechaVencimiento(req.getFechaVencimiento());

        c.setCePrevio(req.getCePrevio());
        c.setCePost(req.getCePost());
        c.setEnviadoCeePost(req.getEnviadoCeePost());
        c.setLicenciaObras(req.getLicenciaObras());
        c.setMtd(req.getMtd());
        c.setPlanos(req.getPlanos());
        c.setSubvencionEstado(req.getSubvencionEstado());
        c.setLibroEdifIncluido(req.getLibroEdifIncluido());
        c.setObservaciones(req.getObservaciones());
    }

    private void validarFechas(LocalDate inicio, LocalDate vencimiento) {
        if (inicio == null || vencimiento == null) return;
        if (!vencimiento.isAfter(inicio)) {
            throw new IllegalArgumentException("La fecha de vencimiento debe ser posterior a la de inicio.");
        }
    }

    private String getUsuarioActual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return "Sistema";
        String name = auth.getName();
        return (name == null || name.isBlank()) ? "Sistema" : name;
    }
}
