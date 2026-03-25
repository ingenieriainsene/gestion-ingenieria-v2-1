package com.ingenieria.service;

import com.ingenieria.dto.AnadirAVentasRequest;
import com.ingenieria.dto.TramiteContratoResponse;
import com.ingenieria.dto.TramiteDetalleResponse;
import com.ingenieria.dto.TramiteMapaResponse;
import com.ingenieria.dto.TramiteVentaResponse;
import com.ingenieria.model.Contrato;
import com.ingenieria.model.Presupuesto;
import com.ingenieria.model.Tramite;
import com.ingenieria.model.TecnicoInstalador;
import com.ingenieria.repository.ContratoRepository;
import com.ingenieria.repository.PresupuestoRepository;
import com.ingenieria.repository.TramiteRepository;
import com.ingenieria.repository.TecnicoInstaladorRepository;
import lombok.RequiredArgsConstructor;
import java.util.ArrayList;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TramiteService {

    private final TramiteRepository tramiteRepository;
    private final AuditoriaService auditoriaService;
    private final ContratoRepository contratoRepository;
    private final PresupuestoRepository presupuestoRepository;
    private final TecnicoInstaladorRepository tecnicoInstaladorRepository;

    @Transactional(readOnly = true)
    public List<Tramite> findAll() {
        return tramiteRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Tramite> findById(Long id) {
        return tramiteRepository.findById(id);
    }

    /**
     * Detalle completo para la página de detalle (replica detalle_tramite.php).
     * Incluye trámite, contrato, cliente y local.
     */
    @Transactional(readOnly = true)
    public TramiteDetalleResponse findDetalleById(Long id) {
        Tramite t = tramiteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trámite no encontrado: " + id));
        Contrato c = t.getContrato();
        if (c == null)
            throw new RuntimeException("Trámite sin contrato: " + id);

        TramiteDetalleResponse resp = new TramiteDetalleResponse();
        resp.setIdTramite(t.getIdTramite());
        resp.setIdContrato(c.getIdContrato());
        resp.setIdCliente(c.getCliente() != null ? c.getCliente().getIdCliente() : null);
        resp.setIdLocal(c.getLocal() != null ? c.getLocal().getIdLocal() : null);
        resp.setTipoTramite(t.getTipoTramite());
        resp.setEstado(t.getEstado());
        resp.setDescripcion(t.getDescripcion());
        resp.setFechaCreacion(t.getFechaCreacion());
        resp.setFechaSeguimiento(t.getFechaSeguimiento());
        resp.setFechaEjecucion(t.getFechaEjecucion());
        resp.setTecnicoAsignado(t.getTecnicoAsignado());
        resp.setEsUrgente(t.getEsUrgente());
        resp.setTipoContrato(c.getTipoContrato());
        resp.setObservacionesContrato(c.getObservaciones());
        resp.setCePrevio(c.getCePrevio());
        resp.setCePost(c.getCePost());
        resp.setMtd(c.getMtd());
        resp.setPlanos(c.getPlanos());
        resp.setEnviadoCeePost(c.getEnviadoCeePost());
        resp.setLicenciaObras(c.getLicenciaObras());
        resp.setSubvencionEstado(c.getSubvencionEstado());
        resp.setLibroEdifIncluido(c.getLibroEdifIncluido());
        resp.setClienteNombre(c.getCliente() != null ? c.getCliente().getNombre() : null);
        resp.setClienteApellido1(c.getCliente() != null ? c.getCliente().getApellido1() : null);
        resp.setClienteDni(c.getCliente() != null ? c.getCliente().getDni() : null);
        resp.setLocalDireccion(c.getLocal() != null ? c.getLocal().getDireccionCompleta() : null);
        resp.setLocalNombreTitular(c.getLocal() != null ? c.getLocal().getNombreTitular() : null);
        resp.setLocalCups(c.getLocal() != null ? c.getLocal().getCups() : null);
        resp.setLocalCp(c.getCliente() != null ? c.getCliente().getCodigoPostal() : null);
        resp.setLocalLocalidad(""); 
        resp.setLocalProvincia("");
        resp.setFechaInicio(c.getFechaInicio());
        resp.setFechaVencimiento(c.getFechaVencimiento());
        resp.setFacturado(t.getFacturado());
        resp.setInstaladores(new ArrayList<>(t.getInstaladores()));
        return resp;
    }

    @Transactional(readOnly = true)
    public List<Tramite> findByContratoId(Long idContrato) {
        return tramiteRepository.findByContrato_IdContrato(idContrato);
    }

    @Transactional(readOnly = true)
    public List<TramiteContratoResponse> findAllByLocalId(Long idLocal) {
        return tramiteRepository.findByContrato_Local_IdLocalOrderByFechaCreacionDesc(idLocal).stream()
                .map(t -> new TramiteContratoResponse(
                        t.getIdTramite(),
                        t.getContrato() != null ? t.getContrato().getIdContrato() : null,
                        t.getTipoTramite(),
                        t.getEstado(),
                        t.getDescripcion(),
                        t.getFechaCreacion(),
                        t.getFechaSeguimiento(),
                        t.getFechaEjecucion(),
                        t.getTecnicoAsignado()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Tramite> findVentasPendientes() {
        return tramiteRepository.findByEstadoOrderByFechaCreacionDesc("Pendiente");
    }

    @Transactional(readOnly = true)
    public List<TramiteVentaResponse> findVentasPendientesResponse() {
        return tramiteRepository.findByEstadoOrderByFechaCreacionDesc("Pendiente").stream()
                .map(t -> new TramiteVentaResponse(
                        t.getIdTramite(),
                        t.getContrato() != null ? t.getContrato().getIdContrato() : null,
                        t.getTipoTramite(),
                        t.getEstado(),
                        t.getDescripcion(),
                        t.getFechaCreacion(),
                        t.getFechaSeguimiento()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TramiteVentaResponse> findPendientesByContratoId(Long idContrato) {
        return tramiteRepository
                .findByContrato_IdContratoAndEstadoOrderByFechaCreacionDesc(idContrato, "Pendiente")
                .stream()
                .map(t -> new TramiteVentaResponse(
                        t.getIdTramite(),
                        idContrato,
                        t.getTipoTramite(),
                        t.getEstado(),
                        t.getDescripcion(),
                        t.getFechaCreacion(),
                        t.getFechaSeguimiento()))
                .collect(Collectors.toList());
    }

    /**
     * Todos los trámites del contrato (cualquier estado). Única fuente de verdad
     * para el frontend.
     * Orden: fecha_creacion DESC.
     */
    @Transactional(readOnly = true)
    public List<TramiteContratoResponse> findAllByContratoId(Long idContrato) {
        return tramiteRepository.findByContrato_IdContrato(idContrato).stream()
                .sorted(Comparator.comparing(Tramite::getFechaCreacion,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(t -> new TramiteContratoResponse(
                        t.getIdTramite(),
                        idContrato,
                        t.getTipoTramite(),
                        t.getEstado(),
                        t.getDescripcion(),
                        t.getFechaCreacion(),
                        t.getFechaSeguimiento(),
                        t.getFechaEjecucion(),
                        t.getTecnicoAsignado()))
                .collect(Collectors.toList());
    }

    /**
     * Listado global de intervenciones para la vista general.
     * Incluye datos de Cliente y Local para mostrar en la tabla.
     */
    @Transactional(readOnly = true)
    public List<com.ingenieria.dto.TramiteListResponse> findAllList() {
        List<Tramite> all = tramiteRepository.findAll();
        System.out.println("DEBUG: findAllList found " + all.size() + " tramites.");

        return all.stream()
                .sorted(Comparator.comparing(
                        Tramite::getFechaCreacion,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(t -> {
                    Contrato c = t.getContrato();
                    String cliente = "N/A";
                    String local = "N/A";

                    try {
                        if (c != null && c.getCliente() != null) {
                            cliente = c.getCliente().getNombre() + " " + c.getCliente().getApellido1();
                        }
                        if (c != null && c.getLocal() != null) {
                            local = c.getLocal().getDireccionCompleta();
                        }
                    } catch (Exception e) {
                        System.err.println("DEBUG: Error mapping cliente/local for tramite " + t.getIdTramite() + ": "
                                + e.getMessage());
                    }

                    return new com.ingenieria.dto.TramiteListResponse(
                            t.getIdTramite(),
                            c != null ? c.getIdContrato() : null,
                            t.getTipoTramite(),
                            t.getEstado(),
                            t.getFechaSeguimiento(),
                            t.getEsUrgente(),
                            t.getTecnicoAsignado(),
                            cliente,
                            local,
                            t.getDescripcion(),
                            t.getFacturado());
                })
                .collect(Collectors.toList());
    }

    /**
     * Trámites activos del contrato (En proceso, Terminado) para el Mapa Visual.
     * Replica $res_activas de gestionar_contrato.php. Orden: En proceso primero,
     * luego fecha_creacion DESC.
     */
    @Transactional(readOnly = true)
    public List<TramiteMapaResponse> findActivosByContratoId(Long idContrato) {
        List<Tramite> list = tramiteRepository.findByContrato_IdContratoAndEstadoIn(
                idContrato, List.of("En proceso", "Terminado", "Anulado"));
        return list.stream()
                .sorted(Comparator
                        .comparing((Tramite t) -> "En proceso".equals(t.getEstado()) ? 0 : 1)
                        .thenComparing(Tramite::getFechaCreacion, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(t -> new TramiteMapaResponse(
                        t.getIdTramite(),
                        idContrato,
                        t.getTipoTramite(),
                        t.getEstado(),
                        t.getDescripcion(),
                        t.getFechaCreacion(),
                        t.getFechaSeguimiento(),
                        t.getFechaEjecucion(),
                        t.getTecnicoAsignado()))
                .collect(Collectors.toList());
    }

    @Transactional
    public Tramite save(Tramite tramite) {
        return tramiteRepository.save(tramite);
    }

    @Transactional
    public void deleteById(Long id) {
        tramiteRepository.deleteById(id);
    }

    /**
     * Actualiza campos editables del trámite (estado, urgencia, detalle, fechas).
     * No modifica id, contrato ni fechaCreacion.
     */
    @Transactional
    public Tramite updateBasicFields(Long id, Tramite body) {
        Tramite t = tramiteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trámite no encontrado: " + id));
        if (body.getEstado() != null && !body.getEstado().trim().isEmpty()) {
            t.setEstado(body.getEstado().trim());
        } else if (t.getEstado() == null || t.getEstado().trim().isEmpty()) {
            t.setEstado("Pendiente");
        }
        if (body.getEsUrgente() != null)
            t.setEsUrgente(body.getEsUrgente());
        if (body.getFacturado() != null)
            t.setFacturado(body.getFacturado());
        if (body.getDescripcion() != null)
            t.setDescripcion(body.getDescripcion());
        if (body.getFechaSeguimiento() != null)
            t.setFechaSeguimiento(body.getFechaSeguimiento());
        if (body.getTipoTramite() != null)
            t.setTipoTramite(body.getTipoTramite());
        if (body.getTecnicoAsignado() != null)
            t.setTecnicoAsignado(body.getTecnicoAsignado());
        if (body.getFechaEjecucion() != null)
            t.setFechaEjecucion(body.getFechaEjecucion());
        return tramiteRepository.save(t);
    }

    /**
     * Marca o desmarca el trámite como "venta pendiente".
     * activo=true → estado "Pendiente"; activo=false → estado "Terminado".
     */
    @Transactional
    public Tramite marcarComoVentaPendiente(Long id, boolean activo, String usuarioBd) {
        Tramite t = tramiteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trámite no encontrado: " + id));
        String viejo = t.getEstado() != null ? t.getEstado() : "";
        String nuevo = activo ? "Pendiente" : "Terminado";
        auditoriaService.registrarCambio("TRAMITES_CONTRATO", id, "estado", viejo, nuevo, usuarioBd);
        t.setEstado(nuevo);
        return tramiteRepository.save(t);
    }

    /**
     * Avanza el estado: Pendiente → En proceso → Terminado.
     * Si ya está Terminado, se deja igual.
     */
    @Transactional
    public Tramite avanzarEstado(Long id, String usuarioBd) {
        Tramite t = tramiteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trámite no encontrado: " + id));
        String viejo = t.getEstado() != null ? t.getEstado() : "Pendiente";
        String nuevo;
        switch (viejo) {
            case "Pendiente":
                nuevo = "En proceso";
                break;
            case "En proceso":
                nuevo = "Terminado";
                break;
            default:
                nuevo = viejo;
                break;
        }
        if (!nuevo.equals(viejo)) {
            auditoriaService.registrarCambio("TRAMITES_CONTRATO", id, "estado", viejo, nuevo, usuarioBd);
            t.setEstado(nuevo);
            t = tramiteRepository.save(t);
        }
        return t;
    }

    /**
     * Generar: pasa un trámite de "Pendiente" a "En proceso".
     * Replica acciones_tramites.php?accion=ejecutar para estado Pendiente.
     * El trámite desaparece de Ventas Pendientes y aparece en el Mapa Visual.
     * Devuelve DTO para evitar LazyInitializationException al serializar.
     */
    @Transactional
    public TramiteVentaResponse generar(Long id, String usuarioBd) {
        Tramite t = tramiteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trámite no encontrado: " + id));
        if (!"Pendiente".equals(t.getEstado())) {
            throw new IllegalArgumentException(
                    "Solo se puede generar un trámite en estado Pendiente. Estado actual: " + t.getEstado());
        }
        auditoriaService.registrarCambio("TRAMITES_CONTRATO", id, "estado", "Pendiente", "En proceso", usuarioBd);
        t.setEstado("En proceso");
        Tramite saved = tramiteRepository.save(t);
        Long idContrato = t.getContrato() != null ? t.getContrato().getIdContrato() : null;
        return new TramiteVentaResponse(
                saved.getIdTramite(),
                idContrato,
                saved.getTipoTramite(),
                saved.getEstado(),
                saved.getDescripcion(),
                saved.getFechaCreacion(),
                saved.getFechaSeguimiento());
    }

    @Transactional
    public TramiteVentaResponse crearTramitePendiente(Long idContrato, AnadirAVentasRequest req) {
        if (req == null || req.getTipoTramite() == null || req.getTipoTramite().isBlank()) {
            throw new IllegalArgumentException("tipoTramite es obligatorio");
        }
        Contrato c = contratoRepository.findById(idContrato)
                .orElseThrow(() -> new RuntimeException("Contrato no encontrado: " + idContrato));

        Tramite t = new Tramite();
        t.setContrato(c);
        t.setTipoTramite(req.getTipoTramite().trim());
        t.setDescripcion(req.getDescripcion() != null ? req.getDescripcion().trim() : null);
        t.setEstado("Pendiente");
        t.setFechaSeguimiento(LocalDate.now());
        t.setEsUrgente(false);

        Tramite saved = tramiteRepository.save(t);

        // Vincular presupuesto si el contrato tiene un presupuesto origen
        if (c.getPresupuestoOrigen() != null) {
            Presupuesto p = c.getPresupuestoOrigen();
            p.setTramite(saved);
            presupuestoRepository.save(p);
        }

        return new TramiteVentaResponse(
                saved.getIdTramite(),
                c.getIdContrato(),
                saved.getTipoTramite(),
                saved.getEstado(),
                saved.getDescripcion(),
                saved.getFechaCreacion(),
                saved.getFechaSeguimiento());
    }

    @Transactional
    public Tramite asignarInstalador(Long idTramite, Long idInstalador) {
        Tramite t = tramiteRepository.findById(idTramite)
                .orElseThrow(() -> new RuntimeException("Trámite no encontrado"));
        TecnicoInstalador ins = tecnicoInstaladorRepository.findById(idInstalador)
                .orElseThrow(() -> new RuntimeException("Instalador no encontrado"));

        t.getInstaladores().add(ins);
        return tramiteRepository.save(t);
    }

    @Transactional
    public Tramite desvincularInstalador(Long idTramite, Long idInstalador) {
        Tramite t = tramiteRepository.findById(idTramite)
                .orElseThrow(() -> new RuntimeException("Trámite no encontrado"));

        t.getInstaladores().removeIf(ins -> ins.getIdTecnicoInstalador().equals(idInstalador));
        return tramiteRepository.save(t);
    }
}
