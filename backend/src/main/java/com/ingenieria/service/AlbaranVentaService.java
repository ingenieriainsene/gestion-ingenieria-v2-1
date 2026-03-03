package com.ingenieria.service;

import com.ingenieria.dto.AlbaranVentaDetalleResponse;
import com.ingenieria.dto.AlbaranVentaLineaResponse;
import com.ingenieria.dto.AlbaranVentaResponse;
import com.ingenieria.model.AlbaranVenta;
import com.ingenieria.model.AlbaranVentaLinea;
import com.ingenieria.model.Presupuesto;
import com.ingenieria.model.PresupuestoLinea;
import com.ingenieria.repository.AlbaranVentaRepository;
import com.ingenieria.repository.AlbaranVentaLineaRepository;
import com.ingenieria.repository.PresupuestoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlbaranVentaService {

    private final AlbaranVentaRepository albaranVentaRepository;
    private final AlbaranVentaLineaRepository albaranVentaLineaRepository;
    private final PresupuestoRepository presupuestoRepository;
    private final TramiteService tramiteService;

    @Transactional
    public AlbaranVentaResponse crearDesdePresupuesto(Long presupuestoId, String usuarioBd) {
        boolean existente = albaranVentaRepository.findByPresupuesto_IdPresupuesto(presupuestoId).isPresent();
        AlbaranVenta albaran = obtenerOCrear(presupuestoId, usuarioBd);
        return toResponse(albaran, existente);
    }

    @Transactional
    public AlbaranVenta obtenerOCrear(Long presupuestoId, String usuarioBd) {
        Presupuesto p = presupuestoRepository.findById(presupuestoId)
                .orElseThrow(() -> new IllegalArgumentException("Presupuesto no encontrado"));

        if (p.getTramite() == null || p.getTramite().getIdTramite() == null) {
            throw new IllegalArgumentException("El presupuesto no está vinculado a una intervención.");
        }
        if (p.getEstado() == null || !"Aceptado".equalsIgnoreCase(p.getEstado())) {
            throw new IllegalArgumentException("Solo se puede generar albarán de presupuestos aceptados.");
        }

        Optional<AlbaranVenta> existente = albaranVentaRepository.findByPresupuesto_IdPresupuesto(presupuestoId);
        if (existente.isPresent()) {
            AlbaranVenta albaran = existente.get();
            asegurarLineas(albaran, p);
            tramiteService.marcarComoVentaPendiente(p.getTramite().getIdTramite(), true, usuarioBd);
            return albaran;
        }

        AlbaranVenta nuevo = new AlbaranVenta();
        nuevo.setPresupuesto(p);
        nuevo.setTramite(p.getTramite());
        nuevo.setFecha(LocalDate.now());
        nuevo.setNumeroAlbaran(generarNumero(p));
        nuevo.setImporte(resolverImporte(p));
        nuevo.setNotas(generarNota(p));

        AlbaranVenta saved = albaranVentaRepository.save(nuevo);
        asegurarLineas(saved, p);
        tramiteService.marcarComoVentaPendiente(p.getTramite().getIdTramite(), true, usuarioBd);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<AlbaranVentaDetalleResponse> findDetallesByTramite(Long tramiteId) {
        return albaranVentaRepository.findByTramite_IdTramite(tramiteId).stream()
                .map(a -> {
                    long count = albaranVentaLineaRepository.countByAlbaran_IdAlbaran(a.getIdAlbaran());
                    if (count == 0 && a.getPresupuesto() != null && a.getPresupuesto().getIdPresupuesto() != null) {
                        Presupuesto p = presupuestoRepository.findByIdWithLineas(a.getPresupuesto().getIdPresupuesto())
                                .orElse(null);
                        if (p != null) {
                            asegurarLineas(a, p);
                        }
                    }
                    return toDetalleResponse(a);
                })
                .collect(Collectors.toList());
    }


    private AlbaranVentaResponse toResponse(AlbaranVenta a, boolean existente) {
        Long presupuestoId = a.getPresupuesto() != null ? a.getPresupuesto().getIdPresupuesto() : null;
        Long tramiteId = a.getTramite() != null ? a.getTramite().getIdTramite() : null;
        return new AlbaranVentaResponse(
                a.getIdAlbaran(),
                a.getNumeroAlbaran(),
                a.getFecha(),
                a.getImporte(),
                presupuestoId,
                tramiteId,
                existente);
    }

    private AlbaranVentaDetalleResponse toDetalleResponse(AlbaranVenta a) {
        List<AlbaranVentaLinea> lineas = albaranVentaLineaRepository
                .findByAlbaran_IdAlbaranOrderByOrdenAsc(a.getIdAlbaran());
        Totales totales = calcularTotales(lineas);
        List<AlbaranVentaLineaResponse> mapped = lineas.stream()
                .map(l -> new AlbaranVentaLineaResponse(
                        l.getConcepto(),
                        l.getCantidad(),
                        l.getPrecioUnitario(),
                        l.getIvaPorcentaje(),
                        l.getTotalLinea(),
                        l.getTotalIva(),
                        l.getTotalConIva()))
                .collect(Collectors.toList());

        Long presupuestoId = a.getPresupuesto() != null ? a.getPresupuesto().getIdPresupuesto() : null;
        Long tramiteId = a.getTramite() != null ? a.getTramite().getIdTramite() : null;

        return new AlbaranVentaDetalleResponse(
                a.getIdAlbaran(),
                a.getNumeroAlbaran(),
                a.getFecha(),
                totales.subtotal,
                totales.iva,
                totales.total,
                presupuestoId,
                tramiteId,
                mapped);
    }

    private String generarNumero(Presupuesto p) {
        int year = LocalDate.now().getYear();
        return "ALB-V-" + year + "-" + p.getIdPresupuesto();
    }

    private BigDecimal resolverImporte(Presupuesto p) {
        if (p.getTotalConIva() != null) {
            return p.getTotalConIva();
        }
        if (p.getTotal() != null) {
            return p.getTotal();
        }
        return BigDecimal.ZERO;
    }

    private String generarNota(Presupuesto p) {
        String ref = p.getCodigoReferencia() != null ? p.getCodigoReferencia() : ("#" + p.getIdPresupuesto());
        return "Generado desde presupuesto " + ref;
    }

    private void asegurarLineas(AlbaranVenta albaran, Presupuesto p) {
        if (albaran.getIdAlbaran() == null) {
            return;
        }
        long existentes = albaranVentaLineaRepository.countByAlbaran_IdAlbaran(albaran.getIdAlbaran());
        if (existentes > 0) {
            return;
        }
        if (p.getLineas() == null || p.getLineas().isEmpty()) {
            return;
        }
        List<PresupuestoLinea> lineas = new ArrayList<>(p.getLineas());
        lineas.sort(Comparator
                .comparing(PresupuestoLinea::getCodigoVisual, Comparator.nullsLast(String::compareTo))
                .thenComparing(PresupuestoLinea::getOrden, Comparator.nullsLast(Integer::compareTo)));

        int orden = 1;
        for (PresupuestoLinea l : lineas) {
            if (l == null || !"PARTIDA".equalsIgnoreCase(l.getTipoJerarquia())) {
                continue;
            }
            BigDecimal cantidad = safe(l.getCantidad());
            BigDecimal precio = safe(l.getPvpUnitario() != null ? l.getPvpUnitario() : l.getPrecioUnitario());
            BigDecimal base = calcularBaseLinea(l);
            BigDecimal ivaPct = l.getIvaPorcentaje() != null ? l.getIvaPorcentaje() : BigDecimal.valueOf(21);
            BigDecimal iva = round2(base.multiply(ivaPct).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
            BigDecimal total = round2(base.add(iva));

            String concepto = l.getProductoTexto() != null && !l.getProductoTexto().isBlank()
                    ? l.getProductoTexto()
                    : (l.getConcepto() != null ? l.getConcepto() : "—");
            if (l.getCodigoVisual() != null) {
                concepto = l.getCodigoVisual() + " " + concepto;
            }

            AlbaranVentaLinea linea = new AlbaranVentaLinea();
            linea.setAlbaran(albaran);
            linea.setOrden(orden++);
            linea.setConcepto(concepto);
            linea.setCantidad(cantidad);
            linea.setPrecioUnitario(precio);
            linea.setIvaPorcentaje(ivaPct);
            linea.setTotalLinea(base);
            linea.setTotalIva(iva);
            linea.setTotalConIva(total);

            albaranVentaLineaRepository.save(linea);
        }

        Totales totales = calcularTotales(
                albaranVentaLineaRepository.findByAlbaran_IdAlbaranOrderByOrdenAsc(albaran.getIdAlbaran()));
        albaran.setImporte(totales.total);
        albaranVentaRepository.save(albaran);
    }

    private Totales calcularTotales(List<AlbaranVentaLinea> lineas) {
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal iva = BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;
        for (AlbaranVentaLinea l : lineas) {
            subtotal = subtotal.add(safe(l.getTotalLinea()));
            iva = iva.add(safe(l.getTotalIva()));
            total = total.add(safe(l.getTotalConIva()));
        }
        return new Totales(round2(subtotal), round2(iva), round2(total));
    }

    private BigDecimal calcularBaseLinea(PresupuestoLinea l) {
        if (l.getTotalPvp() != null) {
            return round2(l.getTotalPvp());
        }
        if (l.getTotalLinea() != null) {
            return round2(l.getTotalLinea());
        }
        BigDecimal qty = safe(l.getCantidad());
        BigDecimal pu = safe(l.getPvpUnitario() != null ? l.getPvpUnitario() : l.getPrecioUnitario());
        return round2(qty.multiply(pu));
    }

    private BigDecimal safe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private BigDecimal round2(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private static class Totales {
        private final BigDecimal subtotal;
        private final BigDecimal iva;
        private final BigDecimal total;

        private Totales(BigDecimal subtotal, BigDecimal iva, BigDecimal total) {
            this.subtotal = subtotal;
            this.iva = iva;
            this.total = total;
        }
    }
}
