package com.ingenieria.service;

import com.ingenieria.dto.CompraDocumentoCreateRequest;
import com.ingenieria.dto.CompraDocumentoDTO;
import com.ingenieria.dto.CompraDocumentoLineaDTO;
import com.ingenieria.model.AlbaranProveedor;
import com.ingenieria.model.AlbaranProveedorLinea;
import com.ingenieria.model.FacturaProveedor;
import com.ingenieria.model.FacturaProveedorLinea;
import com.ingenieria.model.Proveedor;
import com.ingenieria.model.Tramite;
import com.ingenieria.repository.AlbaranProveedorRepository;
import com.ingenieria.repository.AlbaranProveedorLineaRepository;
import com.ingenieria.repository.FacturaProveedorRepository;
import com.ingenieria.repository.FacturaProveedorLineaRepository;
import com.ingenieria.repository.ProveedorRepository;
import com.ingenieria.repository.TramiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompraService {

    private final AlbaranProveedorRepository albaranProveedorRepository;
    private final FacturaProveedorRepository facturaProveedorRepository;
    private final AlbaranProveedorLineaRepository albaranProveedorLineaRepository;
    private final FacturaProveedorLineaRepository facturaProveedorLineaRepository;
    private final ProveedorRepository proveedorRepository;
    private final TramiteRepository tramiteRepository;

    @Transactional(readOnly = true)
    public List<CompraDocumentoDTO> findDocumentosByTramite(Long idTramite) {
        List<CompraDocumentoDTO> albaranes = albaranProveedorRepository.findByTramite_IdTramite(idTramite).stream()
                .map(a -> toDto(a, "ALBARAN"))
                .collect(Collectors.toList());
        List<CompraDocumentoDTO> facturas = facturaProveedorRepository.findByTramite_IdTramite(idTramite).stream()
                .map(f -> toDto(f, "FACTURA"))
                .collect(Collectors.toList());
        albaranes.addAll(facturas);
        return albaranes;
    }

    @Transactional
    public CompraDocumentoDTO crearDocumento(Long idTramite, CompraDocumentoCreateRequest req) {
        if (req == null) {
            throw new IllegalArgumentException("Cuerpo de la petición inválido.");
        }
        String tipo = req.getTipo() != null ? req.getTipo().trim().toUpperCase() : "ALBARAN";
        if (!tipo.equals("ALBARAN") && !tipo.equals("FACTURA")) {
            throw new IllegalArgumentException("tipo debe ser ALBARAN o FACTURA.");
        }
        validarRequisitos(req);

        Tramite tramite = tramiteRepository.findById(idTramite)
                .orElseThrow(() -> new IllegalArgumentException("Trámite no encontrado."));
        Proveedor proveedor = proveedorRepository.findById(req.getIdProveedor())
                .orElseThrow(() -> new IllegalArgumentException("Proveedor no encontrado."));

        LineasTotales totales = construirLineas(req.getLineas());
        if (totales == null && req.getImporte() == null) {
            throw new IllegalArgumentException("importe es obligatorio si no se envían líneas.");
        }

        if (tipo.equals("FACTURA")) {
            FacturaProveedor f = new FacturaProveedor();
            f.setTramite(tramite);
            f.setProveedor(proveedor);
            f.setNumeroFactura(req.getNumeroDocumento().trim());
            f.setFecha(req.getFecha());
            f.setImporte(totales != null ? totales.total : req.getImporte());
            f.setEstado(req.getEstado() != null && !req.getEstado().isBlank() ? req.getEstado().trim() : "Pendiente");
            f.setNotas(req.getNotas() != null && !req.getNotas().isBlank() ? req.getNotas().trim() : null);
            FacturaProveedor saved = facturaProveedorRepository.save(f);
            if (totales != null) {
                guardarLineasFactura(saved, totales.lineas);
            }
            return toDto(saved, "FACTURA");
        }

        AlbaranProveedor a = new AlbaranProveedor();
        a.setTramite(tramite);
        a.setProveedor(proveedor);
        a.setNumeroAlbaran(req.getNumeroDocumento().trim());
        a.setFecha(req.getFecha());
        a.setImporte(totales != null ? totales.total : req.getImporte());
        a.setNotas(req.getNotas() != null && !req.getNotas().isBlank() ? req.getNotas().trim() : null);
        AlbaranProveedor saved = albaranProveedorRepository.save(a);
        if (totales != null) {
            guardarLineasAlbaran(saved, totales.lineas);
        }
        return toDto(saved, "ALBARAN");
    }

    @Transactional
    public void eliminarDocumento(String tipoRaw, Long idDocumento) {
        if (idDocumento == null) {
            throw new IllegalArgumentException("idDocumento es obligatorio.");
        }
        String tipo = tipoRaw != null ? tipoRaw.trim().toUpperCase() : "";
        if (!tipo.equals("ALBARAN") && !tipo.equals("FACTURA")) {
            throw new IllegalArgumentException("tipo debe ser ALBARAN o FACTURA.");
        }

        if (tipo.equals("ALBARAN")) {
            AlbaranProveedor albaran = albaranProveedorRepository.findById(idDocumento)
                    .orElseThrow(() -> new IllegalArgumentException("Albarán no encontrado."));
            List<AlbaranProveedorLinea> lineas = albaranProveedorLineaRepository
                    .findByAlbaran_IdAlbaranOrderByOrdenAsc(albaran.getIdAlbaran());
            if (!lineas.isEmpty()) {
                albaranProveedorLineaRepository.deleteAll(lineas);
            }
            albaranProveedorRepository.delete(albaran);
            return;
        }

        FacturaProveedor factura = facturaProveedorRepository.findById(idDocumento)
                .orElseThrow(() -> new IllegalArgumentException("Factura no encontrada."));
        List<FacturaProveedorLinea> lineas = facturaProveedorLineaRepository
                .findByFactura_IdFacturaOrderByOrdenAsc(factura.getIdFactura());
        if (!lineas.isEmpty()) {
            facturaProveedorLineaRepository.deleteAll(lineas);
        }
        facturaProveedorRepository.delete(factura);
    }

    private void validarRequisitos(CompraDocumentoCreateRequest req) {
        if (req.getIdProveedor() == null) {
            throw new IllegalArgumentException("idProveedor es obligatorio.");
        }
        if (req.getNumeroDocumento() == null || req.getNumeroDocumento().isBlank()) {
            throw new IllegalArgumentException("numeroDocumento es obligatorio.");
        }
        if (req.getFecha() == null) {
            req.setFecha(LocalDate.now());
        }
    }

    private CompraDocumentoDTO toDto(AlbaranProveedor a, String tipo) {
        Long idProveedor = a.getProveedor() != null ? a.getProveedor().getIdProveedor() : null;
        String proveedorNombre = a.getProveedor() != null
                ? (a.getProveedor().getNombreComercial() != null ? a.getProveedor().getNombreComercial()
                        : a.getProveedor().getRazonSocial())
                : "—";
        List<AlbaranProveedorLinea> lineas = albaranProveedorLineaRepository
                .findByAlbaran_IdAlbaranOrderByOrdenAsc(a.getIdAlbaran());
        List<CompraDocumentoLineaDTO> mapped = toLineaDto(lineas);
        LineasTotales totales = calcularTotales(mapped);
        return new CompraDocumentoDTO(
                a.getIdAlbaran(),
                tipo,
                idProveedor,
                proveedorNombre,
                a.getNumeroAlbaran(),
                a.getFecha(),
                totales.subtotal != null ? totales.subtotal : a.getImporte(),
                totales.iva != null ? totales.iva : BigDecimal.ZERO,
                totales.total != null ? totales.total : a.getImporte(),
                null,
                a.getNotas(),
                mapped);
    }

    private CompraDocumentoDTO toDto(FacturaProveedor f, String tipo) {
        Long idProveedor = f.getProveedor() != null ? f.getProveedor().getIdProveedor() : null;
        String proveedorNombre = f.getProveedor() != null
                ? (f.getProveedor().getNombreComercial() != null ? f.getProveedor().getNombreComercial()
                        : f.getProveedor().getRazonSocial())
                : "—";
        List<FacturaProveedorLinea> lineas = facturaProveedorLineaRepository
                .findByFactura_IdFacturaOrderByOrdenAsc(f.getIdFactura());
        List<CompraDocumentoLineaDTO> mapped = toLineaDtoFactura(lineas);
        LineasTotales totales = calcularTotales(mapped);
        return new CompraDocumentoDTO(
                f.getIdFactura(),
                tipo,
                idProveedor,
                proveedorNombre,
                f.getNumeroFactura(),
                f.getFecha(),
                totales.subtotal != null ? totales.subtotal : f.getImporte(),
                totales.iva != null ? totales.iva : BigDecimal.ZERO,
                totales.total != null ? totales.total : f.getImporte(),
                f.getEstado(),
                f.getNotas(),
                mapped);
    }

    private void guardarLineasAlbaran(AlbaranProveedor a, List<CompraDocumentoLineaDTO> lineas) {
        int orden = 1;
        for (CompraDocumentoLineaDTO l : lineas) {
            AlbaranProveedorLinea row = new AlbaranProveedorLinea();
            row.setAlbaran(a);
            row.setOrden(orden++);
            row.setConcepto(l.getConcepto());
            row.setCantidad(l.getCantidad());
            row.setPrecioUnitario(l.getPrecioUnitario());
            row.setIvaPorcentaje(l.getIvaPorcentaje());
            row.setTotalLinea(l.getTotalLinea());
            row.setTotalIva(l.getTotalIva());
            row.setTotalConIva(l.getTotalConIva());
            albaranProveedorLineaRepository.save(row);
        }
    }

    private void guardarLineasFactura(FacturaProveedor f, List<CompraDocumentoLineaDTO> lineas) {
        int orden = 1;
        for (CompraDocumentoLineaDTO l : lineas) {
            FacturaProveedorLinea row = new FacturaProveedorLinea();
            row.setFactura(f);
            row.setOrden(orden++);
            row.setConcepto(l.getConcepto());
            row.setCantidad(l.getCantidad());
            row.setPrecioUnitario(l.getPrecioUnitario());
            row.setIvaPorcentaje(l.getIvaPorcentaje());
            row.setTotalLinea(l.getTotalLinea());
            row.setTotalIva(l.getTotalIva());
            row.setTotalConIva(l.getTotalConIva());
            facturaProveedorLineaRepository.save(row);
        }
    }

    private List<CompraDocumentoLineaDTO> toLineaDto(List<AlbaranProveedorLinea> lineas) {
        return lineas.stream()
                .map(l -> new CompraDocumentoLineaDTO(
                        l.getConcepto(),
                        l.getCantidad(),
                        l.getPrecioUnitario(),
                        l.getIvaPorcentaje(),
                        l.getTotalLinea(),
                        l.getTotalIva(),
                        l.getTotalConIva()))
                .collect(Collectors.toList());
    }

    private List<CompraDocumentoLineaDTO> toLineaDtoFactura(List<FacturaProveedorLinea> lineas) {
        return lineas.stream()
                .map(l -> new CompraDocumentoLineaDTO(
                        l.getConcepto(),
                        l.getCantidad(),
                        l.getPrecioUnitario(),
                        l.getIvaPorcentaje(),
                        l.getTotalLinea(),
                        l.getTotalIva(),
                        l.getTotalConIva()))
                .collect(Collectors.toList());
    }

    private LineasTotales construirLineas(List<CompraDocumentoLineaDTO> lineas) {
        if (lineas == null || lineas.isEmpty()) {
            return null;
        }
        List<CompraDocumentoLineaDTO> normalized = new java.util.ArrayList<>();
        for (CompraDocumentoLineaDTO l : lineas) {
            if (l == null || l.getConcepto() == null || l.getConcepto().isBlank()) {
                throw new IllegalArgumentException("concepto es obligatorio en las líneas.");
            }
            java.math.BigDecimal cantidad = safe(l.getCantidad());
            java.math.BigDecimal precio = safe(l.getPrecioUnitario());
            java.math.BigDecimal ivaPct = l.getIvaPorcentaje() != null ? l.getIvaPorcentaje() : java.math.BigDecimal.valueOf(21);
            java.math.BigDecimal base = round2(cantidad.multiply(precio));
            java.math.BigDecimal iva = round2(base.multiply(ivaPct).divide(java.math.BigDecimal.valueOf(100), 4, java.math.RoundingMode.HALF_UP));
            java.math.BigDecimal total = round2(base.add(iva));
            normalized.add(new CompraDocumentoLineaDTO(
                    l.getConcepto().trim(),
                    cantidad,
                    precio,
                    ivaPct,
                    base,
                    iva,
                    total));
        }
        return calcularTotales(normalized);
    }

    private LineasTotales calcularTotales(List<CompraDocumentoLineaDTO> lineas) {
        java.math.BigDecimal subtotal = java.math.BigDecimal.ZERO;
        java.math.BigDecimal iva = java.math.BigDecimal.ZERO;
        java.math.BigDecimal total = java.math.BigDecimal.ZERO;
        List<CompraDocumentoLineaDTO> out = new java.util.ArrayList<>();
        for (CompraDocumentoLineaDTO l : lineas) {
            subtotal = subtotal.add(safe(l.getTotalLinea()));
            iva = iva.add(safe(l.getTotalIva()));
            total = total.add(safe(l.getTotalConIva()));
            out.add(l);
        }
        return new LineasTotales(round2(subtotal), round2(iva), round2(total), out);
    }

    private LineasTotales calcularTotalesFactura(List<FacturaProveedorLinea> lineas) {
        List<CompraDocumentoLineaDTO> mapped = toLineaDtoFactura(lineas);
        return calcularTotales(mapped);
    }

    private java.math.BigDecimal safe(java.math.BigDecimal v) {
        return v != null ? v : java.math.BigDecimal.ZERO;
    }

    private java.math.BigDecimal round2(java.math.BigDecimal v) {
        if (v == null) return java.math.BigDecimal.ZERO;
        return v.setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private static class LineasTotales {
        private final java.math.BigDecimal subtotal;
        private final java.math.BigDecimal iva;
        private final java.math.BigDecimal total;
        private final List<CompraDocumentoLineaDTO> lineas;

        private LineasTotales(java.math.BigDecimal subtotal, java.math.BigDecimal iva, java.math.BigDecimal total,
                List<CompraDocumentoLineaDTO> lineas) {
            this.subtotal = subtotal;
            this.iva = iva;
            this.total = total;
            this.lineas = lineas;
        }
    }
}
