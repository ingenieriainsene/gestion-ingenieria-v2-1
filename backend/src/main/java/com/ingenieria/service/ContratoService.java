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
    @Autowired
    private ContratoRepository contratoRepository;
    @Autowired
    private ClienteRepository clienteRepository;
    @Autowired
    private LocalRepository localRepository;

    @Transactional
    public List<Contrato> findAll() {
        actualizarEstadosVencidos();
        return contratoRepository.findAll();
    }

    @Transactional
    public Contrato findById(Long id) {
        actualizarEstadosVencidos();
        return contratoRepository.findById(id).orElseThrow();
    }

    public Contrato save(Contrato contrato) {
        return contratoRepository.save(contrato);
    }

    public void delete(Long id) {
        contratoRepository.deleteById(id);
    }

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

    @Transactional
    public Contrato updateFromRequest(Long idContrato, ContratoRequest req) {
        System.out.println("DEBUG: Updating contract " + idContrato + " with estado: " + req.getEstado()
                + ", anularHijos: " + req.getAnularHijos());
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

        System.out.println("DEBUG: Final state before save: " + c.getEstado());
        Contrato saved = contratoRepository.save(c);
        contratoRepository.flush(); // Force flush
        System.out.println("DEBUG: Saved contract " + saved.getIdContrato() + " with state: " + saved.getEstado());

        // Lógica de anulación en cascada
        if ("Anulado".equalsIgnoreCase(req.getEstado()) && Boolean.TRUE.equals(req.getAnularHijos())) {
            anularProcesosAsociados(saved);
        }

        return saved;
    }

    private void anularProcesosAsociados(Contrato c) {
        if (c.getTramites() != null) {
            for (com.ingenieria.model.Tramite t : c.getTramites()) {
                t.setEstado("Anulado");
                tramiteRepository.save(t);
                // También anulamos los seguimientos de cada trámite
                List<com.ingenieria.model.Seguimiento> hitos = seguimientoRepo
                        .findByTramite_IdTramiteOrderByFechaRegistroDesc(t.getIdTramite());
                for (com.ingenieria.model.Seguimiento s : hitos) {
                    s.setEstado("Anulado");
                    seguimientoRepo.save(s);
                }
            }
        }
    }

    @Autowired
    private com.ingenieria.repository.TramiteRepository tramiteRepository;

    @Autowired
    private com.ingenieria.repository.SeguimientoRepository seguimientoRepo;

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
        if (req.getEstado() != null && !req.getEstado().trim().isBlank()) {
            String est = req.getEstado().trim();
            // Normalizar a Capitalizado para evitar inconsistencias
            if ("activo".equalsIgnoreCase(est))
                est = "Activo";
            if ("terminado".equalsIgnoreCase(est))
                est = "Terminado";
            if ("anulado".equalsIgnoreCase(est))
                est = "Anulado";
            c.setEstado(est);
        } else if (c.getEstado() == null) {
            c.setEstado("Activo");
        }

        // Si ya venció y no está anulado, forzamos Terminado
        if (c.getFechaVencimiento() != null && c.getFechaVencimiento().isBefore(LocalDate.now())) {
            String estadoActual = c.getEstado();
            if (estadoActual == null || estadoActual.isBlank() || "Activo".equalsIgnoreCase(estadoActual)) {
                c.setEstado("Terminado");
            }
        }
    }

    private void validarFechas(LocalDate inicio, LocalDate vencimiento) {
        if (inicio == null || vencimiento == null)
            return;
        if (!vencimiento.isAfter(inicio)) {
            throw new IllegalArgumentException("La fecha de vencimiento debe ser posterior a la de inicio.");
        }
    }

    private void actualizarEstadosVencidos() {
        contratoRepository.marcarVencidos(LocalDate.now());
    }

    private String getUsuarioActual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null)
            return "Sistema";
        String name = auth.getName();
        return (name == null || name.isBlank()) ? "Sistema" : name;
    }
}
