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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PresupuestoService {

    @Autowired private PresupuestoRepository presupuestoRepository;
    @Autowired private ClienteRepository clienteRepository;
    @Autowired private LocalRepository localRepository;

    @Transactional(readOnly = true)
    public List<PresupuestoListResponse> findAll() {
        return presupuestoRepository.findAllWithLineas().stream()
                .map(this::toListResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PresupuestoDTO findById(Long id) {
        Presupuesto p = presupuestoRepository.findByIdWithLineas(id)
                .orElseThrow(() -> new IllegalArgumentException("Presupuesto no encontrado"));
        return toDto(p);
    }

    @Transactional
    public PresupuestoDTO crearPresupuesto(PresupuestoDTO dto) {
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

        BigDecimal total = applyLineas(p, dto.getLineas());
        p.setTotal(total);

        Presupuesto saved = presupuestoRepository.save(p);
        return toDto(saved);
    }

    @Transactional
    public PresupuestoDTO actualizarPresupuesto(Long id, PresupuestoDTO dto) {
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

        BigDecimal total = applyLineas(p, dto.getLineas());
        p.setTotal(total);

        Presupuesto saved = presupuestoRepository.save(p);
        return toDto(saved);
    }

    @Transactional
    public void delete(Long id) {
        presupuestoRepository.deleteById(id);
    }

    private PresupuestoDTO toDto(Presupuesto p) {
        PresupuestoDTO dto = new PresupuestoDTO();
        dto.setIdPresupuesto(p.getIdPresupuesto());
        dto.setClienteId(p.getCliente() != null ? p.getCliente().getIdCliente() : null);
        dto.setViviendaId(p.getVivienda() != null ? p.getVivienda().getIdLocal() : null);
        dto.setCodigoReferencia(p.getCodigoReferencia());
        dto.setFecha(p.getFecha());
        dto.setEstado(p.getEstado());
        dto.setTotal(p.getTotal());
        if (p.getLineas() != null) {
            dto.setLineas(p.getLineas().stream().map(this::toLineaDto).collect(Collectors.toList()));
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
        dto.setCantidad(l.getCantidad());
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
        String tipoLinea = joinLineField(p.getLineas(), PresupuestoLinea::getConcepto);
        String productoNombre = joinLineField(p.getLineas(), PresupuestoLinea::getProductoTexto);
        return new PresupuestoListResponse(
                p.getIdPresupuesto(),
                p.getCodigoReferencia(),
                p.getFecha(),
                p.getTotal(),
                p.getEstado(),
                p.getCliente() != null ? p.getCliente().getIdCliente() : null,
                clienteNombre,
                p.getVivienda() != null ? p.getVivienda().getIdLocal() : null,
                viviendaDir,
                tipoLinea,
                productoNombre
        );
    }

    private String generarReferencia(String ref) {
        if (ref != null && !ref.isBlank()) return ref.trim();
        return "PRES-" + System.currentTimeMillis();
    }

    private BigDecimal calcularTotalLinea(BigDecimal cantidad, BigDecimal precioUnitario, BigDecimal totalLinea) {
        if (totalLinea != null) return totalLinea;
        BigDecimal qty = cantidad != null ? cantidad : BigDecimal.ZERO;
        BigDecimal pu = precioUnitario != null ? precioUnitario : BigDecimal.ZERO;
        return qty.multiply(pu);
    }

    private BigDecimal applyLineas(Presupuesto p, List<PresupuestoLineaDTO> lineasDto) {
        List<PresupuestoLinea> lineas = p.getLineas();
        if (lineas == null) {
            lineas = new ArrayList<>();
            p.setLineas(lineas);
        } else {
            lineas.clear();
        }

        BigDecimal total = BigDecimal.ZERO;
        int idx = 1;
        for (PresupuestoLineaDTO l : lineasDto) {
            PresupuestoLinea linea = new PresupuestoLinea();
            linea.setPresupuesto(p);
            linea.setOrden(l.getOrden() != null ? l.getOrden() : idx);
            linea.setProductoId(l.getProductoId());
            linea.setProductoTexto(l.getProductoTexto());
            linea.setConcepto(l.getConcepto());
            linea.setCantidad(l.getCantidad());
            linea.setPrecioUnitario(l.getPrecioUnitario());

            BigDecimal totalLinea = calcularTotalLinea(l.getCantidad(), l.getPrecioUnitario(), l.getTotalLinea());
            linea.setTotalLinea(totalLinea);
            total = total.add(totalLinea);

            lineas.add(linea);
            idx++;
        }
        return total;
    }

    private String joinLineField(List<PresupuestoLinea> lineas, Function<PresupuestoLinea, String> mapper) {
        if (lineas == null || lineas.isEmpty()) return null;
        Set<String> values = new LinkedHashSet<>();
        for (PresupuestoLinea l : lineas) {
            if (l == null) continue;
            String value = mapper.apply(l);
            if (value == null) continue;
            String trimmed = value.trim();
            if (!trimmed.isEmpty()) values.add(trimmed);
        }
        if (values.isEmpty()) return null;
        return String.join(", ", values);
    }
}
