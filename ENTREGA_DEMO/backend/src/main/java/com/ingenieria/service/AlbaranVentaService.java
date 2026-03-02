package com.ingenieria.service;

import com.ingenieria.dto.AlbaranVentaResponse;
import com.ingenieria.model.AlbaranVenta;
import com.ingenieria.model.Presupuesto;
import com.ingenieria.repository.AlbaranVentaRepository;
import com.ingenieria.repository.PresupuestoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlbaranVentaService {

    private final AlbaranVentaRepository albaranVentaRepository;
    private final PresupuestoRepository presupuestoRepository;
    private final TramiteService tramiteService;

    @Transactional
    public AlbaranVentaResponse crearDesdePresupuesto(Long presupuestoId, String usuarioBd) {
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
            tramiteService.marcarComoVentaPendiente(p.getTramite().getIdTramite(), true, usuarioBd);
            return toResponse(albaran, true);
        }

        AlbaranVenta nuevo = new AlbaranVenta();
        nuevo.setPresupuesto(p);
        nuevo.setTramite(p.getTramite());
        nuevo.setFecha(LocalDate.now());
        nuevo.setNumeroAlbaran(generarNumero(p));
        nuevo.setImporte(resolverImporte(p));
        nuevo.setNotas(generarNota(p));

        AlbaranVenta saved = albaranVentaRepository.save(nuevo);
        tramiteService.marcarComoVentaPendiente(p.getTramite().getIdTramite(), true, usuarioBd);

        return toResponse(saved, false);
    }

    @Transactional(readOnly = true)
    public List<AlbaranVentaResponse> findByTramite(Long tramiteId) {
        return albaranVentaRepository.findByTramite_IdTramite(tramiteId).stream()
                .map(a -> toResponse(a, true))
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
}
