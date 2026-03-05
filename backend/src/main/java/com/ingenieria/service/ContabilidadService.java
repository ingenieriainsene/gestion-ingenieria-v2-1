package com.ingenieria.service;

import com.ingenieria.dto.CompraDocumentoDTO;
import com.ingenieria.dto.ContabilidadVentaDTO;
import com.ingenieria.model.AlbaranProveedor;
import com.ingenieria.model.AlbaranVenta;
import com.ingenieria.model.Cliente;
import com.ingenieria.model.Contrato;
import com.ingenieria.model.FacturaProveedor;
import com.ingenieria.model.FacturaVenta;
import com.ingenieria.model.Presupuesto;
import com.ingenieria.repository.AlbaranProveedorRepository;
import com.ingenieria.repository.AlbaranVentaRepository;
import com.ingenieria.repository.FacturaProveedorRepository;
import com.ingenieria.repository.FacturaVentaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContabilidadService {

    private final AlbaranVentaRepository albaranVentaRepository;
    private final FacturaVentaRepository facturaVentaRepository;
    private final AlbaranProveedorRepository albaranProveedorRepository;
    private final FacturaProveedorRepository facturaProveedorRepository;
    private final CompraService compraService;

    @Transactional(readOnly = true)
    public List<ContabilidadVentaDTO> findAllVentas() {
        List<ContabilidadVentaDTO> result = new ArrayList<>();

        // Albaranes de venta
        for (AlbaranVenta a : albaranVentaRepository.findAll()) {
            Presupuesto p = a.getPresupuesto();
            // Intentamos obtener contrato/cliente desde el trámite asociado
            Contrato c = null;
            Cliente cli = null;
            if (a.getTramite() != null) {
                c = a.getTramite().getContrato();
                if (c != null) {
                    cli = c.getCliente();
                }
            }
            // Fallback: usar cliente del presupuesto si no hay trámite/contrato
            if (cli == null && p != null) {
                cli = p.getCliente();
            }

            String clienteNombre = cli != null
                    ? (cli.getNombre() + " " + (cli.getApellido1() != null ? cli.getApellido1() : "")).trim()
                    : "—";
            Long contratoId = c != null ? c.getIdContrato()
                    : (a.getTramite() != null && a.getTramite().getContrato() != null
                            ? a.getTramite().getContrato().getIdContrato()
                            : null);

            BigDecimal total = a.getImporte() != null ? a.getImporte() : BigDecimal.ZERO;

            result.add(new ContabilidadVentaDTO(
                    a.getIdAlbaran(),
                    "ALBARAN",
                    a.getNumeroAlbaran(),
                    a.getFecha(),
                    clienteNombre,
                    contratoId,
                    total));
        }

        // Facturas de venta
        for (FacturaVenta f : facturaVentaRepository.findAll()) {
            Presupuesto p = f.getPresupuesto();
            Contrato c = null;
            Cliente cli = null;
            if (f.getTramite() != null) {
                c = f.getTramite().getContrato();
                if (c != null) {
                    cli = c.getCliente();
                }
            }
            if (cli == null && p != null) {
                cli = p.getCliente();
            }
            String clienteNombre = cli != null
                    ? (cli.getNombre() + " " + (cli.getApellido1() != null ? cli.getApellido1() : "")).trim()
                    : "—";
            Long contratoId = c != null ? c.getIdContrato()
                    : (f.getTramite() != null && f.getTramite().getContrato() != null
                            ? f.getTramite().getContrato().getIdContrato()
                            : null);

            BigDecimal total = f.getImporte() != null ? f.getImporte() : BigDecimal.ZERO;

            result.add(new ContabilidadVentaDTO(
                    f.getIdFactura(),
                    "FACTURA",
                    f.getNumeroFactura(),
                    f.getFecha(),
                    clienteNombre,
                    contratoId,
                    total));
        }

        return result.stream()
                .sorted(Comparator.comparing(ContabilidadVentaDTO::getFecha,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CompraDocumentoDTO> findAllCompras() {
        List<CompraDocumentoDTO> result = new ArrayList<>();

        // Albaranes de proveedor
        List<AlbaranProveedor> albaranes = albaranProveedorRepository.findAll();
        for (AlbaranProveedor a : albaranes) {
            result.add(compraService.toDto(a, "ALBARAN"));
        }

        // Facturas de proveedor
        List<FacturaProveedor> facturas = facturaProveedorRepository.findAll();
        for (FacturaProveedor f : facturas) {
            result.add(compraService.toDto(f, "FACTURA"));
        }

        return result.stream()
                .sorted(Comparator.comparing(CompraDocumentoDTO::getFecha,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }
}

