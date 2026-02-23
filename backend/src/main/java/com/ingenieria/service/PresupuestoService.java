package com.ingenieria.service;

import com.ingenieria.dto.PresupuestoDTO;
import com.ingenieria.dto.PresupuestoLineaDTO;
import com.ingenieria.dto.PresupuestoListResponse;
import com.ingenieria.model.Cliente;
import com.ingenieria.model.Local;
import com.ingenieria.model.Presupuesto;
import com.ingenieria.model.PresupuestoLinea;
import com.ingenieria.repository.ClienteRepository;
import com.ingenieria.repository.LocalRepository;
import com.ingenieria.repository.PresupuestoRepository;
import com.ingenieria.repository.TramiteRepository;
import com.ingenieria.model.Tramite;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PresupuestoService {

    private static final Logger log = LoggerFactory.getLogger(PresupuestoService.class);

    @Autowired
    private PresupuestoRepository presupuestoRepository;
    @Autowired
    private ClienteRepository clienteRepository;
    @Autowired
    private LocalRepository localRepository;
    @Autowired
    private TramiteRepository tramiteRepository;

    @Transactional(readOnly = true)
    public List<PresupuestoListResponse> findAll() {
        log.info("[Presupuesto] Listado solicitado");
        return presupuestoRepository.findAllWithLineas().stream()
                .map(this::toListResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PresupuestoDTO findById(Long id) {
        log.info("[Presupuesto] Buscar por id: {}", id);
        Presupuesto p = presupuestoRepository.findByIdWithLineas(id)
                .orElseThrow(() -> new IllegalArgumentException("Presupuesto no encontrado"));
        return toDto(p);
    }

    @Transactional
    public PresupuestoDTO crearPresupuesto(PresupuestoDTO dto) {
        log.info("[Presupuesto] Crear presupuesto: clienteId={}, viviendaId={}, lineas={}",
                dto.getClienteId(), dto.getViviendaId(), dto.getLineas() != null ? dto.getLineas().size() : 0);
        if (dto.getClienteId() == null || dto.getViviendaId() == null) {
            throw new IllegalArgumentException("clienteId y viviendaId son obligatorios");
        }
        if (dto.getLineas() == null || dto.getLineas().isEmpty()) {
            throw new IllegalArgumentException("Debe incluir al menos una línea");
        }

        Cliente cliente = clienteRepository.findById(dto.getClienteId())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no válido"));
        Local vivienda = localRepository.findById(dto.getViviendaId())
                .orElseThrow(() -> new IllegalArgumentException("Vivienda no válida"));

        Presupuesto p = new Presupuesto();
        p.setCliente(cliente);
        p.setVivienda(vivienda);
        p.setCodigoReferencia(generarReferencia(dto.getCodigoReferencia()));
        p.setFecha(dto.getFecha() != null ? dto.getFecha() : LocalDate.now());
        p.setEstado(dto.getEstado() != null ? dto.getEstado() : "Borrador");
        p.setTipoPresupuesto(normalizeTipo(dto.getTipoPresupuesto()));
        p.setFechaAceptacion(dto.getFechaAceptacion());
        p.setDiasValidez(dto.getDiasValidez());

        if (dto.getTramiteId() != null) {
            Tramite tramite = tramiteRepository.findById(dto.getTramiteId())
                    .orElseThrow(() -> new IllegalArgumentException("Tramite no válido"));
            p.setTramite(tramite);
        }

        Totales totales = applyLineas(p, dto.getLineas());
        p.setTotalSinIva(totales.totalSinIva);
        p.setTotalConIva(totales.totalConIva);
        p.setTotal(totales.totalConIva);

        Presupuesto saved = presupuestoRepository.save(p);
        log.info("[Presupuesto] Creado id={} total={}", saved.getIdPresupuesto(), saved.getTotal());
        return toDto(saved);
    }

    @Transactional
    public PresupuestoDTO actualizarPresupuesto(Long id, PresupuestoDTO dto) {
        log.info("[Presupuesto] Actualizar id={} lineas={}", id, dto.getLineas() != null ? dto.getLineas().size() : 0);
        if (dto.getClienteId() == null || dto.getViviendaId() == null) {
            throw new IllegalArgumentException("clienteId y viviendaId son obligatorios");
        }
        if (dto.getLineas() == null || dto.getLineas().isEmpty()) {
            throw new IllegalArgumentException("Debe incluir al menos una línea");
        }

        Presupuesto p = presupuestoRepository.findByIdWithLineas(id)
                .orElseThrow(() -> new IllegalArgumentException("Presupuesto no encontrado"));

        Cliente cliente = clienteRepository.findById(dto.getClienteId())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no válido"));
        Local vivienda = localRepository.findById(dto.getViviendaId())
                .orElseThrow(() -> new IllegalArgumentException("Vivienda no válida"));

        p.setCliente(cliente);
        p.setVivienda(vivienda);
        if (dto.getCodigoReferencia() != null && !dto.getCodigoReferencia().isBlank()) {
            p.setCodigoReferencia(dto.getCodigoReferencia().trim());
        }
        if (dto.getFecha() != null) {
            p.setFecha(dto.getFecha());
        }
        if (dto.getEstado() != null && !dto.getEstado().isBlank()) {
            p.setEstado(dto.getEstado().trim());
        }
        if (dto.getTipoPresupuesto() != null && !dto.getTipoPresupuesto().isBlank()) {
            p.setTipoPresupuesto(normalizeTipo(dto.getTipoPresupuesto()));
        } else if (p.getTipoPresupuesto() == null || p.getTipoPresupuesto().isBlank()) {
            p.setTipoPresupuesto("Obra");
        }

        p.setFechaAceptacion(dto.getFechaAceptacion());
        p.setDiasValidez(dto.getDiasValidez());

        // Preserve or update tramiteId
        if (dto.getTramiteId() != null) {
            Tramite tramite = tramiteRepository.findById(dto.getTramiteId())
                    .orElseThrow(() -> new IllegalArgumentException("Tramite no válido"));
            p.setTramite(tramite);
        }

        Totales totales = applyLineas(p, dto.getLineas());
        p.setTotalSinIva(totales.totalSinIva);
        p.setTotalConIva(totales.totalConIva);
        p.setTotal(totales.totalConIva);

        Presupuesto saved = presupuestoRepository.save(p);
        log.info("[Presupuesto] Actualizado id={} total={}", saved.getIdPresupuesto(), saved.getTotal());
        return toDto(saved);
    }

    @Transactional
    public void delete(Long id) {
        log.info("[Presupuesto] Eliminar id={}", id);
        presupuestoRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<PresupuestoListResponse> findByTramite(Long tramiteId) {
        log.info("[Presupuesto] Buscar por tramiteId={}", tramiteId);
        return presupuestoRepository.findByTramiteId(tramiteId).stream()
                .map(this::toListResponse)
                .collect(Collectors.toList());
    }

    private PresupuestoDTO toDto(Presupuesto p) {
        PresupuestoDTO dto = new PresupuestoDTO();
        dto.setIdPresupuesto(p.getIdPresupuesto());
        dto.setClienteId(p.getCliente() != null ? p.getCliente().getIdCliente() : null);
        dto.setViviendaId(p.getVivienda() != null ? p.getVivienda().getIdLocal() : null);
        dto.setCodigoReferencia(p.getCodigoReferencia());
        dto.setFecha(p.getFecha());
        dto.setEstado(p.getEstado());
        dto.setTipoPresupuesto(normalizeTipo(p.getTipoPresupuesto()));
        dto.setFechaAceptacion(p.getFechaAceptacion());
        dto.setDiasValidez(p.getDiasValidez());
        dto.setTramiteId(p.getTramite() != null ? p.getTramite().getIdTramite() : null);
        dto.setTotal(p.getTotal());
        dto.setTotalSinIva(p.getTotalSinIva());
        dto.setTotalConIva(p.getTotalConIva());
        if (p.getLineas() != null) {
            dto.setLineas(buildTree(new java.util.ArrayList<>(p.getLineas())));
        }
        return dto;
    }

    private PresupuestoLineaDTO toLineaDto(PresupuestoLinea l) {
        PresupuestoLineaDTO dto = new PresupuestoLineaDTO();
        dto.setIdLinea(l.getIdLinea());
        dto.setOrden(l.getOrden());
        dto.setProductoId(l.getProductoId());
        dto.setProductoTexto(l.getProductoTexto());
        dto.setConcepto(l.getConcepto());
        dto.setIvaPorcentaje(l.getIvaPorcentaje());
        dto.setCosteUnitario(l.getCosteUnitario());
        dto.setFactorMargen(l.getFactorMargen());
        dto.setTotalCoste(l.getTotalCoste());
        dto.setPvpUnitario(l.getPvpUnitario());
        dto.setTotalPvp(l.getTotalPvp());
        dto.setImporteIva(l.getImporteIva());
        dto.setTotalFinal(l.getTotalFinal());
        dto.setTipoJerarquia(l.getTipoJerarquia());
        dto.setCodigoVisual(l.getCodigoVisual());
        dto.setPadreId(l.getPadre() != null ? l.getPadre().getIdLinea() : null);
        dto.setCantidad(l.getCantidad());
        dto.setNumVisitas(l.getNumVisitas());
        dto.setPrecioUnitario(l.getPrecioUnitario());
        dto.setTotalLinea(l.getTotalLinea());
        return dto;
    }

    private PresupuestoListResponse toListResponse(Presupuesto p) {
        String clienteNombre = null;
        if (p.getCliente() != null) {
            String nombre = p.getCliente().getNombre();
            String ap1 = p.getCliente().getApellido1();
            String ap2 = p.getCliente().getApellido2();
            clienteNombre = (nombre != null ? nombre : "") +
                    (ap1 != null ? " " + ap1 : "") +
                    (ap2 != null ? " " + ap2 : "");
            clienteNombre = clienteNombre.trim();
        }
        String viviendaDir = p.getVivienda() != null ? p.getVivienda().getDireccionCompleta() : null;
        String tipoLinea = joinLineField(new java.util.ArrayList<>(p.getLineas()), PresupuestoLinea::getConcepto);
        String productoNombre = joinLineField(new java.util.ArrayList<>(p.getLineas()),
                PresupuestoLinea::getProductoTexto);
        return new PresupuestoListResponse(
                p.getIdPresupuesto(),
                p.getCodigoReferencia(),
                p.getFecha(),
                p.getTotalConIva() != null ? p.getTotalConIva() : p.getTotal(),
                p.getTotalSinIva(),
                p.getTotalConIva(),
                p.getEstado(),
                normalizeTipo(p.getTipoPresupuesto()),
                p.getCliente() != null ? p.getCliente().getIdCliente() : null,
                clienteNombre,
                p.getVivienda() != null ? p.getVivienda().getIdLocal() : null,
                viviendaDir,
                tipoLinea,
                productoNombre);
    }

    private String normalizeTipo(String tipo) {
        if (tipo == null || tipo.isBlank())
            return "Obra";
        String t = tipo.trim().toLowerCase();
        if (t.equals("obra"))
            return "Obra";
        if (t.equals("correctivo"))
            return "Correctivo";
        if (t.equals("preventivo"))
            return "Preventivo";
        return "Obra";
    }

    private String generarReferencia(String ref) {
        if (ref != null && !ref.isBlank())
            return ref.trim();
        return "PRES-" + System.currentTimeMillis();
    }

    private BigDecimal calcularTotalLinea(BigDecimal cantidad, BigDecimal precioUnitario, BigDecimal totalLinea) {
        if (totalLinea != null)
            return totalLinea;
        BigDecimal qty = cantidad != null ? cantidad : BigDecimal.ZERO;
        BigDecimal pu = precioUnitario != null ? precioUnitario : BigDecimal.ZERO;
        return round2(qty.multiply(pu));
    }

    private Totales applyLineas(Presupuesto p, List<PresupuestoLineaDTO> lineasDto) {
        java.util.Set<PresupuestoLinea> lineas = p.getLineas();
        if (lineas == null) {
            lineas = new java.util.HashSet<>();
            p.setLineas(lineas);
        } else {
            lineas.clear();
        }

        List<PresupuestoLineaDTO> flat = flatten(lineasDto);
        Map<String, PresupuestoLinea> byCodigo = new HashMap<>();
        Map<Long, PresupuestoLinea> byId = new HashMap<>();

        int idx = 1;
        for (PresupuestoLineaDTO l : flat) {
            if (l.getConcepto() == null || l.getConcepto().isBlank()) {
                throw new IllegalArgumentException("El concepto es obligatorio en todas las líneas");
            }
            String tipo = parseTipo(l.getTipoJerarquia());
            if ("PARTIDA".equals(tipo)) {
                if (l.getCantidad() == null || (l.getCosteUnitario() == null && l.getPrecioUnitario() == null)) {
                    throw new IllegalArgumentException("Cantidad y coste unitario son obligatorios en las partidas");
                }
            }
            PresupuestoLinea linea = new PresupuestoLinea();
            if (l.getIdLinea() != null) {
                linea.setIdLinea(l.getIdLinea());
            }
            linea.setPresupuesto(p);
            linea.setOrden(l.getOrden() != null ? l.getOrden() : idx);
            linea.setProductoId(l.getProductoId());
            linea.setProductoTexto(l.getProductoTexto());
            linea.setConcepto(l.getConcepto());
            linea.setIvaPorcentaje(l.getIvaPorcentaje() != null ? l.getIvaPorcentaje() : BigDecimal.valueOf(21));
            linea.setTipoJerarquia(tipo);
            linea.setCodigoVisual(l.getCodigoVisual());
            linea.setCantidad(l.getCantidad());
            linea.setNumVisitas(l.getNumVisitas());
            linea.setCosteUnitario(l.getCosteUnitario() != null ? l.getCosteUnitario() : l.getPrecioUnitario());
            linea.setFactorMargen(l.getFactorMargen() != null ? l.getFactorMargen() : BigDecimal.ONE);
            linea.setPrecioUnitario(l.getPrecioUnitario());

            lineas.add(linea);
            if (linea.getCodigoVisual() != null) {
                byCodigo.put(linea.getCodigoVisual(), linea);
            }
            if (linea.getIdLinea() != null) {
                byId.put(linea.getIdLinea(), linea);
            }
            idx++;
        }

        for (PresupuestoLineaDTO l : flat) {
            PresupuestoLinea child = findByCodigoOrId(l, byCodigo, byId);
            String parentCode = parentCode(l.getCodigoVisual());
            PresupuestoLinea parent = null;
            if (l.getPadreId() != null) {
                parent = byId.get(l.getPadreId());
            } else if (parentCode != null) {
                parent = byCodigo.get(parentCode);
            }
            if (child != null && parent != null) {
                child.setPadre(parent);
                parent.getHijos().add(child);
            }
        }

        BigDecimal totalSinIva = BigDecimal.ZERO;
        BigDecimal totalConIva = BigDecimal.ZERO;

        for (PresupuestoLinea linea : lineas) {
            if ("CAPITULO".equals(linea.getTipoJerarquia())) {
                BigDecimal capCoste = sumaHijosCoste(linea);
                BigDecimal capPvp = sumaHijosPvp(linea);
                BigDecimal capFinal = sumaHijosFinal(linea);
                linea.setCantidad(null);
                linea.setPrecioUnitario(null);
                linea.setCosteUnitario(null);
                linea.setFactorMargen(null);
                linea.setPvpUnitario(null);
                linea.setIvaPorcentaje(null);
                linea.setTotalCoste(capCoste);
                linea.setTotalPvp(capPvp);
                linea.setTotalFinal(capFinal);
                linea.setImporteIva(round2(capFinal.subtract(capPvp)));
                linea.setTotalLinea(capPvp);
                continue;
            }

            LineaCalculos calc = calcularLinea(linea.getCantidad(), linea.getCosteUnitario(), linea.getFactorMargen(),
                    linea.getIvaPorcentaje());
            linea.setTotalCoste(calc.totalCoste);
            linea.setPvpUnitario(calc.pvpUnitario);
            linea.setTotalPvp(calc.totalPvp);
            linea.setImporteIva(calc.importeIva);
            linea.setTotalFinal(calc.totalFinal);
            linea.setTotalLinea(calc.totalPvp);
            linea.setPrecioUnitario(calc.pvpUnitario);

            totalSinIva = totalSinIva.add(calc.totalPvp);
            totalConIva = totalConIva.add(calc.totalFinal);
        }

        return new Totales(round2(totalSinIva), round2(totalConIva));
    }

    private BigDecimal round2(BigDecimal value) {
        if (value == null)
            return BigDecimal.ZERO;
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private static class Totales {
        private final BigDecimal totalSinIva;
        private final BigDecimal totalConIva;

        private Totales(BigDecimal totalSinIva, BigDecimal totalConIva) {
            this.totalSinIva = totalSinIva;
            this.totalConIva = totalConIva;
        }
    }

    private String parseTipo(String value) {
        if (value == null)
            return "PARTIDA";
        String upper = value.trim().toUpperCase();
        if ("CAPITULO".equals(upper) || "PARTIDA".equals(upper)) {
            return upper;
        }
        return "PARTIDA";
    }

    private List<PresupuestoLineaDTO> flatten(List<PresupuestoLineaDTO> lineas) {
        List<PresupuestoLineaDTO> result = new ArrayList<>();
        if (lineas == null)
            return result;
        for (PresupuestoLineaDTO l : lineas) {
            result.add(l);
            if (l.getHijos() != null && !l.getHijos().isEmpty()) {
                result.addAll(flatten(l.getHijos()));
            }
        }
        return result;
    }

    private PresupuestoLinea findByCodigoOrId(PresupuestoLineaDTO dto, Map<String, PresupuestoLinea> byCodigo,
            Map<Long, PresupuestoLinea> byId) {
        if (dto.getIdLinea() != null) {
            PresupuestoLinea found = byId.get(dto.getIdLinea());
            if (found != null)
                return found;
        }
        if (dto.getCodigoVisual() != null) {
            return byCodigo.get(dto.getCodigoVisual());
        }
        return null;
    }

    private String parentCode(String codigo) {
        if (codigo == null)
            return null;
        int idx = codigo.lastIndexOf('.');
        if (idx <= 0)
            return null;
        return codigo.substring(0, idx);
    }

    private BigDecimal sumaHijosCoste(PresupuestoLinea capitulo) {
        BigDecimal total = BigDecimal.ZERO;
        for (PresupuestoLinea h : capitulo.getHijos()) {
            if ("CAPITULO".equals(h.getTipoJerarquia())) {
                total = total.add(sumaHijosCoste(h));
            } else {
                LineaCalculos calc = calcularLinea(h.getCantidad(), h.getCosteUnitario(), h.getFactorMargen(),
                        h.getIvaPorcentaje());
                total = total.add(calc.totalCoste);
            }
        }
        return round2(total);
    }

    private BigDecimal sumaHijosPvp(PresupuestoLinea capitulo) {
        BigDecimal total = BigDecimal.ZERO;
        for (PresupuestoLinea h : capitulo.getHijos()) {
            if ("CAPITULO".equals(h.getTipoJerarquia())) {
                total = total.add(sumaHijosPvp(h));
            } else {
                LineaCalculos calc = calcularLinea(h.getCantidad(), h.getCosteUnitario(), h.getFactorMargen(),
                        h.getIvaPorcentaje());
                total = total.add(calc.totalPvp);
            }
        }
        return round2(total);
    }

    private BigDecimal sumaHijosFinal(PresupuestoLinea capitulo) {
        BigDecimal total = BigDecimal.ZERO;
        for (PresupuestoLinea h : capitulo.getHijos()) {
            if ("CAPITULO".equals(h.getTipoJerarquia())) {
                total = total.add(sumaHijosFinal(h));
            } else {
                LineaCalculos calc = calcularLinea(h.getCantidad(), h.getCosteUnitario(), h.getFactorMargen(),
                        h.getIvaPorcentaje());
                total = total.add(calc.totalFinal);
            }
        }
        return round2(total);
    }

    private List<PresupuestoLineaDTO> buildTree(java.util.Collection<PresupuestoLinea> lineas) {
        Map<Long, PresupuestoLineaDTO> map = new HashMap<>();
        List<PresupuestoLineaDTO> roots = new ArrayList<>();

        for (PresupuestoLinea l : lineas) {
            PresupuestoLineaDTO dto = toLineaDto(l);
            dto.setHijos(new ArrayList<>());
            map.put(l.getIdLinea(), dto);
        }

        for (PresupuestoLinea l : lineas) {
            PresupuestoLineaDTO dto = map.get(l.getIdLinea());
            PresupuestoLinea padre = l.getPadre();
            if (padre != null && padre.getIdLinea() != null && map.containsKey(padre.getIdLinea())) {
                map.get(padre.getIdLinea()).getHijos().add(dto);
            } else {
                roots.add(dto);
            }
        }

        sortTree(roots);
        return roots;
    }

    private void sortTree(List<PresupuestoLineaDTO> nodes) {
        if (nodes == null)
            return;
        nodes.sort(Comparator.comparing(PresupuestoLineaDTO::getCodigoVisual, Comparator.nullsLast(String::compareTo)));
        for (PresupuestoLineaDTO n : nodes) {
            sortTree(n.getHijos());
        }
    }

    private LineaCalculos calcularLinea(BigDecimal cantidad, BigDecimal costeUnitario, BigDecimal factorMargen,
            BigDecimal ivaPorcentaje) {
        BigDecimal qty = cantidad != null ? cantidad : BigDecimal.ZERO;
        BigDecimal coste = costeUnitario != null ? costeUnitario : BigDecimal.ZERO;
        BigDecimal factor = factorMargen != null ? factorMargen : BigDecimal.ONE;
        BigDecimal totalCoste = round2(qty.multiply(coste));
        BigDecimal pvpUnitario = round2(coste.multiply(factor));
        BigDecimal totalPvp = round2(totalCoste.multiply(factor));
        BigDecimal ivaPct = ivaPorcentaje != null ? ivaPorcentaje : BigDecimal.valueOf(21);
        BigDecimal importeIva = round2(
                totalPvp.multiply(ivaPct).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
        BigDecimal totalFinal = round2(totalPvp.add(importeIva));
        return new LineaCalculos(totalCoste, pvpUnitario, totalPvp, importeIva, totalFinal);
    }

    private static class LineaCalculos {
        private final BigDecimal totalCoste;
        private final BigDecimal pvpUnitario;
        private final BigDecimal totalPvp;
        private final BigDecimal importeIva;
        private final BigDecimal totalFinal;

        private LineaCalculos(BigDecimal totalCoste, BigDecimal pvpUnitario, BigDecimal totalPvp, BigDecimal importeIva,
                BigDecimal totalFinal) {
            this.totalCoste = totalCoste;
            this.pvpUnitario = pvpUnitario;
            this.totalPvp = totalPvp;
            this.importeIva = importeIva;
            this.totalFinal = totalFinal;
        }
    }

    private String joinLineField(java.util.Collection<PresupuestoLinea> lineas,
            Function<PresupuestoLinea, String> mapper) {
        if (lineas == null || lineas.isEmpty())
            return null;
        Set<String> values = new LinkedHashSet<>();
        for (PresupuestoLinea l : lineas) {
            if (l == null)
                continue;
            if (l.getTipoJerarquia() != null && !"PARTIDA".equals(l.getTipoJerarquia())) {
                continue;
            }
            String value = mapper.apply(l);
            if (value == null)
                continue;
            String trimmed = value.trim();
            if (!trimmed.isEmpty())
                values.add(trimmed);
        }
        if (values.isEmpty())
            return null;
        return String.join(", ", values);
    }
}
