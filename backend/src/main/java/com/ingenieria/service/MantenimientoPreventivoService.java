package com.ingenieria.service;

import com.ingenieria.dto.*;
import com.ingenieria.model.*;
import com.ingenieria.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MantenimientoPreventivoService {

    @Autowired
    private PresupuestoPreventivoRepository presupuestoRepo;
    @Autowired
    private PresupuestoRepository presupuestoBaseRepo;
    @Autowired
    private ContratoMantenimientoRepository contratoRepo;
    @Autowired
    private ContratoMantenimientoTareaRepository contratoTareaRepo;
    @Autowired
    private AvisoMantenimientoRepository avisoRepo;
    @Autowired
    private AvisoMantenimientoDetalleRepository avisoDetalleRepo;
    @Autowired
    private ClienteRepository clienteRepo;
    @Autowired
    private LocalRepository localRepo;
    @Autowired
    private ContratoRepository contratoBaseRepo;
    @Autowired
    private TramiteRepository tramiteRepo;
    @Autowired
    private SeguimientoRepository seguimientoRepo;
    @Autowired
    private UsuarioRepository usuarioRepo;

    @Transactional(readOnly = true)
    public List<PresupuestoPreventivoDTO> findAllBudgets() {
        return presupuestoRepo.findAllWithTareas().stream()
                .map(this::toBudgetDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PresupuestoPreventivoDTO findBudgetById(Long id) {
        PresupuestoPreventivo p = presupuestoRepo.findByIdWithTareas(id)
                .orElseThrow(() -> new IllegalArgumentException("Presupuesto preventivo no encontrado"));
        return toBudgetDto(p);
    }

    @Transactional
    public PresupuestoPreventivoDTO createBudget(PresupuestoPreventivoDTO dto) {
        if (dto.getClienteId() == null || dto.getViviendaId() == null) {
            throw new IllegalArgumentException("clienteId y viviendaId son obligatorios");
        }
        if (dto.getTareas() == null || dto.getTareas().isEmpty()) {
            throw new IllegalArgumentException("Debe incluir al menos una tarea");
        }
        Cliente cliente = clienteRepo.findById(dto.getClienteId())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no válido"));
        Local vivienda = localRepo.findById(dto.getViviendaId())
                .orElseThrow(() -> new IllegalArgumentException("Vivienda no válida"));

        PresupuestoPreventivo p = new PresupuestoPreventivo();
        p.setCliente(cliente);
        p.setVivienda(vivienda);
        p.setFecha(dto.getFecha() != null ? dto.getFecha() : LocalDate.now());
        p.setEstado(normalizeEstado(dto.getEstado()));
        p.setNotas(dto.getNotas());
        applyTareas(p, dto.getTareas());

        PresupuestoPreventivo saved = presupuestoRepo.save(p);
        return toBudgetDto(saved);
    }

    @Transactional
    public PresupuestoPreventivoDTO updateBudget(Long id, PresupuestoPreventivoDTO dto) {
        PresupuestoPreventivo p = presupuestoRepo.findByIdWithTareas(id)
                .orElseThrow(() -> new IllegalArgumentException("Presupuesto preventivo no encontrado"));
        String prevEstado = p.getEstado();

        if (dto.getClienteId() != null) {
            Cliente cliente = clienteRepo.findById(dto.getClienteId())
                    .orElseThrow(() -> new IllegalArgumentException("Cliente no válido"));
            p.setCliente(cliente);
        }
        if (dto.getViviendaId() != null) {
            Local vivienda = localRepo.findById(dto.getViviendaId())
                    .orElseThrow(() -> new IllegalArgumentException("Vivienda no válida"));
            p.setVivienda(vivienda);
        }
        if (dto.getFecha() != null) {
            p.setFecha(dto.getFecha());
        }
        if (dto.getEstado() != null) {
            p.setEstado(normalizeEstado(dto.getEstado()));
        }
        p.setNotas(dto.getNotas());
        if (dto.getTareas() != null) {
            applyTareas(p, dto.getTareas());
        }

        PresupuestoPreventivo saved = presupuestoRepo.save(p);
        boolean pasaAceptado = isAceptado(saved.getEstado()) && !isAceptado(prevEstado);
        if (pasaAceptado) {
            approveBudgetAndCreateContract(saved.getIdPresupuestoPrev());
        }
        return toBudgetDto(saved);
    }

    @Transactional
    public ContratoMantenimientoDTO approveBudgetAndCreateContract(Long budgetId) {
        PresupuestoPreventivo p = presupuestoRepo.findByIdWithTareas(budgetId)
                .orElseThrow(() -> new IllegalArgumentException("Presupuesto preventivo no encontrado"));
        if (!isAceptado(p.getEstado())) {
            p.setEstado("Aceptado");
            presupuestoRepo.save(p);
        }

        Optional<ContratoMantenimiento> existing = contratoRepo.findByPresupuestoPreventivo_IdPresupuestoPrev(budgetId);
        if (existing.isPresent()) {
            return toContractDto(existing.get());
        }

        ContratoMantenimiento c = new ContratoMantenimiento();
        c.setPresupuestoPreventivo(p);
        c.setCliente(p.getCliente());
        c.setVivienda(p.getVivienda());
        c.setFechaInicio(p.getFecha() != null ? p.getFecha() : LocalDate.now());
        c.setEstado("Activo");
        c.setCreadoPor(getUsuarioActual());
        ContratoMantenimiento saved = contratoRepo.save(c);

        List<ContratoMantenimientoTarea> tareas = new ArrayList<>();
        for (PresupuestoPreventivoTarea t : p.getTareas()) {
            if (t.getActivo() != null && !t.getActivo())
                continue;
            ContratoMantenimientoTarea ct = new ContratoMantenimientoTarea();
            ct.setContrato(saved);
            ct.setNombre(t.getNombre());
            ct.setDescripcion(t.getDescripcion());
            ct.setFrecuenciaMeses(t.getFrecuenciaMeses());
            ct.setOrden(t.getOrden());
            ct.setActivo(t.getActivo() != null ? t.getActivo() : true);
            tareas.add(ct);
        }
        if (!tareas.isEmpty()) {
            contratoTareaRepo.saveAll(tareas);
        }
        saved.setTareas(tareas);
        return toContractDto(saved);
    }

    @Transactional
    public ContratoMantenimientoDTO createContractFromPresupuesto(Long presupuestoId) {
        PresupuestoPreventivo existente = presupuestoRepo.findByPresupuesto_IdPresupuesto(presupuestoId).orElse(null);
        if (existente != null) {
            Optional<ContratoMantenimiento> cm = contratoRepo
                    .findByPresupuestoPreventivo_IdPresupuestoPrev(existente.getIdPresupuestoPrev());
            if (cm.isPresent()) {
                return toContractDto(cm.get());
            }
            return approveBudgetAndCreateContract(existente.getIdPresupuestoPrev());
        }

        Presupuesto p = presupuestoBaseRepo.findByIdWithLineas(presupuestoId)
                .orElseThrow(() -> new IllegalArgumentException("Presupuesto no encontrado"));
        if (p.getLineas() == null || p.getLineas().isEmpty()) {
            throw new IllegalArgumentException("El presupuesto no contiene partidas");
        }

        PresupuestoPreventivo prev = new PresupuestoPreventivo();
        prev.setPresupuesto(p);
        prev.setCliente(p.getCliente());
        prev.setVivienda(p.getVivienda());
        prev.setFecha(p.getFecha() != null ? p.getFecha() : LocalDate.now());
        prev.setEstado("Aceptado");

        List<PresupuestoPreventivoTarea> tareas = new ArrayList<>();
        int orden = 1;
        for (PresupuestoLinea l : p.getLineas()) {
            if (!isPartida(l))
                continue;
            PresupuestoPreventivoTarea t = new PresupuestoPreventivoTarea();
            t.setPresupuesto(prev);
            t.setNombre(l.getConcepto());
            t.setDescripcion(l.getProductoTexto());
            t.setFrecuenciaMeses(12);
            t.setOrden(l.getOrden() != null ? l.getOrden() : orden++);
            t.setActivo(true);
            tareas.add(t);
        }

        if (tareas.isEmpty()) {
            throw new IllegalArgumentException("El presupuesto no contiene partidas válidas");
        }

        prev.setTareas(tareas);
        PresupuestoPreventivo savedPrev = presupuestoRepo.save(prev);
        return approveBudgetAndCreateContract(savedPrev.getIdPresupuestoPrev());
    }

    @Transactional(readOnly = true)
    public ContratoMantenimientoDTO getContractByBudget(Long budgetId) {
        return contratoRepo.findByPresupuestoPreventivoWithTareas(budgetId)
                .map(this::toContractDto)
                .orElse(null);
    }

    @Transactional
    public GenerarAvisosResponse generateNoticesForContract(Long contractId, LocalDate hasta,
            GenerarAvisosRequest req) {
        ContratoMantenimiento contrato = contratoRepo.findByIdWithTareas(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contrato de mantenimiento no encontrado"));
        LocalDate inicio = contrato.getFechaInicio() != null ? contrato.getFechaInicio() : LocalDate.now();
        LocalDate fin = (hasta != null) ? hasta : inicio.plusMonths(12);
        if (fin.isBefore(inicio)) {
            throw new IllegalArgumentException("La fecha fin debe ser posterior a la fecha inicio");
        }

        if (avisoRepo.existsByContrato_IdContratoMant(contractId)) {
            Contrato contratoBase = contrato.getContrato() != null
                    ? contrato.getContrato()
                    : ensureContratoBase(contrato, inicio, fin);
            List<AvisoMantenimientoDTO> avisos = avisoRepo
                    .findByContrato_IdContratoMantOrderByFechaProgramadaAsc(contractId).stream()
                    .map(this::toNoticeDto)
                    .collect(Collectors.toList());
            GenerarAvisosResponse res = new GenerarAvisosResponse();
            res.setContratoId(contratoBase != null ? contratoBase.getIdContrato() : null);
            res.setAvisos(avisos);
            return res;
        }

        List<ContratoMantenimientoTarea> tareas = contratoTareaRepo
                .findByContrato_IdContratoMantAndActivoTrue(contractId);
        Map<Long, LocalDate> overrides = buildOverrides(req);
        Map<LocalDate, List<ContratoMantenimientoTarea>> agrupadas = new TreeMap<>();

        for (ContratoMantenimientoTarea t : tareas) {
            Integer freq = t.getFrecuenciaMeses();
            if (freq == null || freq <= 0)
                continue;
            LocalDate fechaOverride = overrides.getOrDefault(t.getIdTareaContrato(), inicio);
            LocalDate fecha = (fechaOverride != null && fechaOverride.isBefore(inicio)) ? inicio : fechaOverride;
            while (!fecha.isAfter(fin)) {
                agrupadas.computeIfAbsent(fecha, k -> new ArrayList<>()).add(t);
                fecha = fecha.plusMonths(freq);
            }
        }

        for (Map.Entry<LocalDate, List<ContratoMantenimientoTarea>> entry : agrupadas.entrySet()) {
            LocalDate fecha = entry.getKey();
            AvisoMantenimiento aviso = avisoRepo
                    .findByContrato_IdContratoMantAndFechaProgramada(contractId, fecha)
                    .orElseGet(() -> {
                        AvisoMantenimiento nuevo = new AvisoMantenimiento();
                        nuevo.setContrato(contrato);
                        nuevo.setFechaProgramada(fecha);
                        nuevo.setEstado("Pendiente");
                        return avisoRepo.save(nuevo);
                    });

            for (ContratoMantenimientoTarea tarea : entry.getValue()) {
                boolean exists = avisoDetalleRepo.existsByAviso_IdAvisoAndTarea_IdTareaContrato(
                        aviso.getIdAviso(), tarea.getIdTareaContrato());
                if (exists)
                    continue;
                AvisoMantenimientoDetalle det = new AvisoMantenimientoDetalle();
                det.setAviso(aviso);
                det.setTarea(tarea);
                det.setEstado("Pendiente");
                avisoDetalleRepo.save(det);
            }
        }

        Contrato contratoBase = ensureContratoBase(contrato, inicio, fin);
        if (contratoBase != null) {
            Tramite tramite = ensureTramiteMantenimiento(contratoBase, agrupadas);
            if (tramite != null) {
                createSeguimientosFromAgrupadas(tramite, agrupadas);
            }
        }

        List<AvisoMantenimientoDTO> avisos = avisoRepo
                .findByContrato_IdContratoMantOrderByFechaProgramadaAsc(contractId).stream()
                .map(this::toNoticeDto)
                .collect(Collectors.toList());
        GenerarAvisosResponse res = new GenerarAvisosResponse();
        res.setContratoId(contratoBase != null ? contratoBase.getIdContrato() : null);
        res.setAvisos(avisos);
        return res;
    }

    @Transactional(readOnly = true)
    public ContratoMantenimientoDTO getContractById(Long id) {
        ContratoMantenimiento c = contratoRepo.findByIdWithTareas(id)
                .orElseThrow(() -> new IllegalArgumentException("Contrato de mantenimiento no encontrado"));
        return toContractDto(c);
    }

    @Transactional(readOnly = true)
    public List<AvisoMantenimientoDTO> getNoticesByContract(Long contractId) {
        return avisoRepo.findByContrato_IdContratoMantOrderByFechaProgramadaAsc(contractId).stream()
                .map(this::toNoticeDto)
                .collect(Collectors.toList());
    }

    private PresupuestoPreventivoDTO toBudgetDto(PresupuestoPreventivo p) {
        PresupuestoPreventivoDTO dto = new PresupuestoPreventivoDTO();
        dto.setIdPresupuestoPrev(p.getIdPresupuestoPrev());
        dto.setClienteId(p.getCliente() != null ? p.getCliente().getIdCliente() : null);
        dto.setViviendaId(p.getVivienda() != null ? p.getVivienda().getIdLocal() : null);
        dto.setFecha(p.getFecha());
        dto.setEstado(p.getEstado());
        dto.setNotas(p.getNotas());
        if (p.getTareas() != null) {
            dto.setTareas(p.getTareas().stream().map(this::toBudgetTaskDto).collect(Collectors.toList()));
        }
        return dto;
    }

    private PresupuestoPreventivoTareaDTO toBudgetTaskDto(PresupuestoPreventivoTarea t) {
        PresupuestoPreventivoTareaDTO dto = new PresupuestoPreventivoTareaDTO();
        dto.setIdTareaPrev(t.getIdTareaPrev());
        dto.setNombre(t.getNombre());
        dto.setDescripcion(t.getDescripcion());
        dto.setFrecuenciaMeses(t.getFrecuenciaMeses());
        dto.setOrden(t.getOrden());
        dto.setActivo(t.getActivo());
        return dto;
    }

    private ContratoMantenimientoDTO toContractDto(ContratoMantenimiento c) {
        ContratoMantenimientoDTO dto = new ContratoMantenimientoDTO();
        dto.setIdContratoMant(c.getIdContratoMant());
        dto.setPresupuestoPrevId(
                c.getPresupuestoPreventivo() != null ? c.getPresupuestoPreventivo().getIdPresupuestoPrev() : null);
        dto.setContratoId(c.getContrato() != null ? c.getContrato().getIdContrato() : null);
        dto.setClienteId(c.getCliente() != null ? c.getCliente().getIdCliente() : null);
        dto.setViviendaId(c.getVivienda() != null ? c.getVivienda().getIdLocal() : null);
        dto.setFechaInicio(c.getFechaInicio());
        dto.setEstado(c.getEstado());
        if (c.getTareas() != null) {
            dto.setTareas(c.getTareas().stream().map(this::toContractTaskDto).collect(Collectors.toList()));
        }
        return dto;
    }

    private ContratoMantenimientoTareaDTO toContractTaskDto(ContratoMantenimientoTarea t) {
        ContratoMantenimientoTareaDTO dto = new ContratoMantenimientoTareaDTO();
        dto.setIdTareaContrato(t.getIdTareaContrato());
        dto.setNombre(t.getNombre());
        dto.setDescripcion(t.getDescripcion());
        dto.setFrecuenciaMeses(t.getFrecuenciaMeses());
        dto.setOrden(t.getOrden());
        dto.setActivo(t.getActivo());
        return dto;
    }

    private AvisoMantenimientoDTO toNoticeDto(AvisoMantenimiento a) {
        AvisoMantenimientoDTO dto = new AvisoMantenimientoDTO();
        dto.setIdAviso(a.getIdAviso());
        dto.setContratoId(a.getContrato() != null ? a.getContrato().getIdContratoMant() : null);
        dto.setFechaProgramada(a.getFechaProgramada());
        dto.setEstado(a.getEstado());
        if (a.getDetalles() != null) {
            dto.setDetalles(a.getDetalles().stream().map(this::toNoticeDetailDto).collect(Collectors.toList()));
        }
        return dto;
    }

    private AvisoMantenimientoDetalleDTO toNoticeDetailDto(AvisoMantenimientoDetalle d) {
        AvisoMantenimientoDetalleDTO dto = new AvisoMantenimientoDetalleDTO();
        dto.setIdAvisoDet(d.getIdAvisoDet());
        dto.setTareaContratoId(d.getTarea() != null ? d.getTarea().getIdTareaContrato() : null);
        dto.setTareaNombre(d.getTarea() != null ? d.getTarea().getNombre() : null);
        dto.setEstado(d.getEstado());
        return dto;
    }

    private Map<Long, LocalDate> buildOverrides(GenerarAvisosRequest req) {
        if (req == null || req.getTareas() == null)
            return Collections.emptyMap();
        Map<Long, LocalDate> map = new HashMap<>();
        for (GenerarAvisosRequest.TareaInicioOverride t : req.getTareas()) {
            if (t.getTareaContratoId() == null || t.getFechaInicio() == null)
                continue;
            map.put(t.getTareaContratoId(), t.getFechaInicio());
        }
        return map;
    }

    private Contrato ensureContratoBase(ContratoMantenimiento contrato, LocalDate inicio, LocalDate fin) {
        if (contrato.getContrato() != null) {
            return contrato.getContrato();
        }
        Contrato c = new Contrato();
        c.setCliente(contrato.getCliente());
        c.setLocal(contrato.getVivienda());
        c.setFechaInicio(inicio);
        c.setFechaVencimiento(fin);
        c.setTipoContrato("Preventivo");
        c.setObservaciones("Contrato generado desde mantenimiento preventivo");
        c.setCreadoPor(getUsuarioActual());
        Contrato saved = contratoBaseRepo.saveAndFlush(c);
        contrato.setContrato(saved);
        contratoRepo.saveAndFlush(contrato);
        return saved;
    }

    private Tramite ensureTramiteMantenimiento(Contrato contrato,
            Map<LocalDate, List<ContratoMantenimientoTarea>> agrupadas) {
        return tramiteRepo.findByContrato_IdContratoAndTipoTramite(contrato.getIdContrato(), "Mantenimiento")
                .orElseGet(() -> {
                    Tramite t = new Tramite();
                    t.setContrato(contrato);
                    t.setTipoTramite("Mantenimiento");
                    t.setEstado("Pendiente");
                    t.setEsUrgente(false);
                    LocalDate fecha = (agrupadas instanceof TreeMap && !agrupadas.isEmpty())
                            ? ((TreeMap<LocalDate, List<ContratoMantenimientoTarea>>) agrupadas).firstKey()
                            : LocalDate.now();
                    t.setFechaSeguimiento(fecha);
                    t.setDetalleSeguimiento(buildResumenTareas(agrupadas));
                    return tramiteRepo.save(t);
                });
    }

    private void createSeguimientosFromAgrupadas(Tramite tramite,
            Map<LocalDate, List<ContratoMantenimientoTarea>> agrupadas) {
        if (agrupadas == null || agrupadas.isEmpty())
            return;
        Usuario usuario = resolveUsuarioActual();
        for (Map.Entry<LocalDate, List<ContratoMantenimientoTarea>> entry : agrupadas.entrySet()) {
            LocalDate fecha = entry.getKey();
            for (ContratoMantenimientoTarea tarea : entry.getValue()) {
                String comentario = (tarea != null && tarea.getNombre() != null && !tarea.getNombre().isBlank())
                        ? tarea.getNombre()
                        : "Tarea de mantenimiento";
                if (seguimientoRepo.existsByTramite_IdTramiteAndComentarioAndFechaSeguimiento(
                        tramite.getIdTramite(), comentario, fecha)) {
                    continue;
                }
                Seguimiento s = new Seguimiento();
                s.setTramite(tramite);
                s.setComentario(comentario);
                s.setFechaSeguimiento(fecha);
                s.setEstado("Pendiente");
                s.setEsUrgente(false);
                s.setCreador(usuario);
                s.setUsuarioAsignado(usuario);
                seguimientoRepo.save(s);
            }
        }
    }

    private String buildResumenTareas(Map<LocalDate, List<ContratoMantenimientoTarea>> agrupadas) {
        if (agrupadas == null || agrupadas.isEmpty())
            return "Mantenimiento preventivo";
        Set<String> nombres = new LinkedHashSet<>();
        for (List<ContratoMantenimientoTarea> list : agrupadas.values()) {
            if (list == null)
                continue;
            for (ContratoMantenimientoTarea t : list) {
                if (t != null && t.getNombre() != null && !t.getNombre().isBlank()) {
                    nombres.add(t.getNombre().trim());
                }
            }
        }
        if (nombres.isEmpty())
            return "Mantenimiento preventivo";
        return "Tareas: " + String.join(", ", nombres);
    }

    private Usuario resolveUsuarioActual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null) {
            Usuario u = usuarioRepo.findByNombreUsuario(auth.getName()).orElse(null);
            if (u != null)
                return u;
        }
        return usuarioRepo.findAll().stream().findFirst()
                .orElseThrow(() -> new RuntimeException("No hay usuarios en el sistema"));
    }

    private boolean isPartida(PresupuestoLinea l) {
        if (l == null)
            return false;
        if ("PARTIDA".equals(l.getTipoJerarquia()))
            return true;
        return l.getPadre() != null;
    }

    private void applyTareas(PresupuestoPreventivo p, List<PresupuestoPreventivoTareaDTO> tareas) {
        if (p.getTareas() == null) {
            p.setTareas(new ArrayList<>());
        } else {
            p.getTareas().clear();
        }
        int idx = 1;
        for (PresupuestoPreventivoTareaDTO dto : tareas) {
            if (dto.getNombre() == null || dto.getNombre().isBlank()) {
                throw new IllegalArgumentException("Nombre de tarea obligatorio");
            }
            if (dto.getFrecuenciaMeses() == null || dto.getFrecuenciaMeses() <= 0) {
                throw new IllegalArgumentException("Frecuencia en meses debe ser mayor que 0");
            }
            PresupuestoPreventivoTarea t = new PresupuestoPreventivoTarea();
            t.setPresupuesto(p);
            t.setNombre(dto.getNombre().trim());
            t.setDescripcion(dto.getDescripcion());
            t.setFrecuenciaMeses(dto.getFrecuenciaMeses());
            t.setOrden(dto.getOrden() != null ? dto.getOrden() : idx);
            t.setActivo(dto.getActivo() != null ? dto.getActivo() : true);
            p.getTareas().add(t);
            idx++;
        }
    }

    private String normalizeEstado(String estado) {
        if (estado == null || estado.isBlank())
            return "Borrador";
        String e = estado.trim().toLowerCase();
        if (e.equals("pendiente"))
            return "Pendiente";
        if (e.equals("aceptado") || e.equals("aceptada"))
            return "Aceptado";
        if (e.equals("borrador"))
            return "Borrador";
        return estado.trim();
    }

    private boolean isAceptado(String estado) {
        if (estado == null)
            return false;
        return estado.trim().equalsIgnoreCase("Aceptado");
    }

    private String getUsuarioActual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null)
            return "Sistema";
        String name = auth.getName();
        return (name == null || name.isBlank()) ? "Sistema" : name;
    }
}
