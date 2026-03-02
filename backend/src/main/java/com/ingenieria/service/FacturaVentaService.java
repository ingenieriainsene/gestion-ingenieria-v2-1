package com.ingenieria.service;

import com.ingenieria.model.FacturaVenta;
import com.ingenieria.model.Presupuesto;
import com.ingenieria.model.Tramite;
import com.ingenieria.repository.FacturaVentaRepository;
import com.ingenieria.repository.PresupuestoRepository;
import com.ingenieria.repository.TramiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FacturaVentaService {

    private final FacturaVentaRepository facturaVentaRepository;
    private final PresupuestoRepository presupuestoRepository;
    private final TramiteRepository tramiteRepository;
    private final TramiteService tramiteService;

    @Transactional
    public FacturaVenta obtenerOCrear(Long presupuestoId, String usuarioBd) {
        Presupuesto p = presupuestoRepository.findById(presupuestoId)
                .orElseThrow(() -> new IllegalArgumentException("Presupuesto no encontrado"));

        if (p.getTramite() == null || p.getTramite().getIdTramite() == null) {
            throw new IllegalArgumentException("El presupuesto no está vinculado a una intervención.");
        }
        if (p.getEstado() == null || !"Aceptado".equalsIgnoreCase(p.getEstado())) {
            throw new IllegalArgumentException("Solo se puede generar factura de presupuestos aceptados.");
        }

        Optional<FacturaVenta> existente = facturaVentaRepository.findByPresupuesto_IdPresupuesto(presupuestoId);
        if (existente.isPresent()) {
            marcarFacturado(p.getTramite(), usuarioBd);
            return existente.get();
        }

        FacturaVenta nueva = new FacturaVenta();
        nueva.setPresupuesto(p);
        nueva.setTramite(p.getTramite());
        nueva.setFecha(LocalDate.now());
        nueva.setNumeroFactura(generarNumero(p));
        nueva.setImporte(resolverImporte(p));
        nueva.setEstado("Emitida");
        nueva.setNotas("Generada desde presupuesto " + (p.getCodigoReferencia() != null ? p.getCodigoReferencia()
                : ("#" + p.getIdPresupuesto())));

        FacturaVenta saved = facturaVentaRepository.save(nueva);
        marcarFacturado(p.getTramite(), usuarioBd);
        return saved;
    }

    private void marcarFacturado(Tramite tramite, String usuarioBd) {
        if (tramite == null || tramite.getIdTramite() == null) {
            return;
        }
        Tramite t = tramiteRepository.findById(tramite.getIdTramite())
                .orElse(tramite);
        if (t.getFacturado() == null || !t.getFacturado()) {
            t.setFacturado(true);
            tramiteRepository.save(t);
        }
        tramiteService.marcarComoVentaPendiente(t.getIdTramite(), true, usuarioBd);
    }

    private String generarNumero(Presupuesto p) {
        int year = LocalDate.now().getYear();
        return "FAC-V-" + year + "-" + p.getIdPresupuesto();
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
}
