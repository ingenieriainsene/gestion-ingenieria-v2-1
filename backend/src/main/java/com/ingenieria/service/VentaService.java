package com.ingenieria.service;

import com.ingenieria.dto.VentaDocumentoCreateRequest;
import com.ingenieria.dto.VentaDocumentoDTO;
import com.ingenieria.model.AlbaranVenta;
import com.ingenieria.model.FacturaVenta;
import com.ingenieria.model.Presupuesto;
import com.ingenieria.model.Tramite;
import com.ingenieria.repository.AlbaranVentaRepository;
import com.ingenieria.repository.FacturaVentaRepository;
import com.ingenieria.repository.PresupuestoRepository;
import com.ingenieria.repository.TramiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class VentaService {

    private final AlbaranVentaRepository albaranRepo;
    private final FacturaVentaRepository facturaRepo;
    private final TramiteRepository tramiteRepo;
    private final PresupuestoRepository presupuestoRepo;

    @Transactional(readOnly = true)
    public List<VentaDocumentoDTO> findByTramite(Long idTramite) {
        List<VentaDocumentoDTO> out = new ArrayList<>();

        for (AlbaranVenta a : albaranRepo.findByTramite_IdTramite(idTramite)) {
            out.add(toDtoAlbaran(a));
        }
        for (FacturaVenta f : facturaRepo.findByTramite_IdTramite(idTramite)) {
            out.add(toDtoFactura(f));
        }
        out.sort(Comparator.comparing(VentaDocumentoDTO::getFecha));
        return out;
    }

    @Transactional
    public VentaDocumentoDTO crearDocumento(Long idTramite, VentaDocumentoCreateRequest req) {
        if (req == null) {
            throw new IllegalArgumentException("Cuerpo de la petición inválido.");
        }
        String tipo = Optional.ofNullable(req.getTipo()).orElse("ALBARAN").trim().toUpperCase();
        if (!tipo.equals("ALBARAN") && !tipo.equals("FACTURA")) {
            throw new IllegalArgumentException("tipo debe ser ALBARAN o FACTURA.");
        }
        if (req.getNumeroDocumento() == null || req.getNumeroDocumento().isBlank()) {
            throw new IllegalArgumentException("numeroDocumento es obligatorio.");
        }

        Tramite tramite = tramiteRepo.findById(idTramite)
                .orElseThrow(() -> new IllegalArgumentException("Trámite no encontrado."));

        Presupuesto p = null;
        if (req.getPresupuestoId() != null) {
            p = presupuestoRepo.findById(req.getPresupuestoId())
                    .orElseThrow(() -> new IllegalArgumentException("Presupuesto no encontrado."));
        }

        LocalDate fecha = Optional.ofNullable(req.getFecha()).orElse(LocalDate.now());
        BigDecimal importe = Optional.ofNullable(req.getImporte()).orElse(BigDecimal.ZERO);
        String notas = (req.getNotas() != null && !req.getNotas().isBlank()) ? req.getNotas().trim() : null;

        if (tipo.equals("ALBARAN")) {
            AlbaranVenta a = new AlbaranVenta();
            a.setTramite(tramite);
            a.setPresupuesto(p);
            a.setNumeroAlbaran(req.getNumeroDocumento().trim());
            a.setFecha(fecha);
            a.setImporte(importe);
            a.setNotas(notas);
            AlbaranVenta saved = albaranRepo.save(a);
            return toDtoAlbaran(saved);
        } else {
            FacturaVenta f = new FacturaVenta();
            f.setTramite(tramite);
            f.setPresupuesto(p);
            f.setNumeroFactura(req.getNumeroDocumento().trim());
            f.setFecha(fecha);
            f.setImporte(importe);
            f.setEstado("Emitida");
            f.setNotas(notas);
            FacturaVenta saved = facturaRepo.save(f);
            return toDtoFactura(saved);
        }
    }

    private VentaDocumentoDTO toDtoAlbaran(AlbaranVenta a) {
        VentaDocumentoDTO dto = new VentaDocumentoDTO();
        dto.setIdDocumento(a.getIdAlbaran());
        dto.setTipo("ALBARAN");
        dto.setNumeroDocumento(a.getNumeroAlbaran());
        dto.setFecha(a.getFecha());
        dto.setSubtotal(a.getImporte());
        dto.setIva(BigDecimal.ZERO);
        dto.setTotal(a.getImporte());
        dto.setPresupuestoId(a.getPresupuesto() != null ? a.getPresupuesto().getIdPresupuesto() : null);
        dto.setTramiteId(a.getTramite() != null ? a.getTramite().getIdTramite() : null);
        dto.setNotas(a.getNotas());
        dto.setLineas(List.of());
        return dto;
    }

    private VentaDocumentoDTO toDtoFactura(FacturaVenta f) {
        VentaDocumentoDTO dto = new VentaDocumentoDTO();
        dto.setIdDocumento(f.getIdFactura());
        dto.setTipo("FACTURA");
        dto.setNumeroDocumento(f.getNumeroFactura());
        dto.setFecha(f.getFecha());
        dto.setSubtotal(f.getImporte());
        dto.setIva(BigDecimal.ZERO);
        dto.setTotal(f.getImporte());
        dto.setPresupuestoId(f.getPresupuesto() != null ? f.getPresupuesto().getIdPresupuesto() : null);
        dto.setTramiteId(f.getTramite() != null ? f.getTramite().getIdTramite() : null);
        dto.setNotas(f.getNotas());
        dto.setLineas(List.of());
        return dto;
    }
}

