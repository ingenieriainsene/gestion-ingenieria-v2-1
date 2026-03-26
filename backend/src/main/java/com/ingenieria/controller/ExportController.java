package com.ingenieria.controller;

import com.ingenieria.model.*;
import com.ingenieria.service.*;
import com.ingenieria.repository.PresupuestoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public class ExportController {

    private final ClienteService clienteService;
    private final ContratoService contratoService;
    private final TramiteService tramiteService;
    private final LocalService localService;
    private final SeguimientoService seguimientoService;
    private final ProveedorService proveedorService;
    private final ListadoExporterService exporterService;
    private final PresupuestoRepository presupuestoRepository;

    @GetMapping("/clientes")
    public ResponseEntity<byte[]> exportClientes() {
        List<Cliente> clientes = clienteService.findAll();
        List<String> headers = Arrays.asList("ID", "Nombre", "DNI/CIF", "Teléfono", "Email", "Dirección Fiscal");
        
        List<List<String>> rows = clientes.stream().map(c -> Arrays.asList(
            String.valueOf(c.getIdCliente()),
            (c.getNombre() + " " + (c.getApellido1() != null ? c.getApellido1() : "")).trim(),
            c.getDni() != null ? c.getDni() : "—",
            c.getTelefonos() != null && !c.getTelefonos().isEmpty() ? c.getTelefonos().iterator().next().getTelefono() : "—",
            c.getEmail() != null ? c.getEmail() : "—",
            c.getDireccionFiscalCompleta() != null ? c.getDireccionFiscalCompleta() : "—"
        )).collect(Collectors.toList());

        byte[] pdf = exporterService.exportToPdf("Listado de Clientes", headers, rows);
        return createResponse(pdf, "listado-clientes.pdf");
    }

    @GetMapping("/contratos")
    public ResponseEntity<byte[]> exportContratos() {
        List<Contrato> contratos = contratoService.findAll();
        List<String> headers = Arrays.asList("ID", "Número", "Fecha Inicio", "Cliente", "Estado", "Tipo");

        List<List<String>> rows = contratos.stream().map(c -> Arrays.asList(
            String.valueOf(c.getIdContrato()),
            c.getIdContrato() != null ? "CTR-" + c.getIdContrato() : "—",
            c.getFechaInicio() != null ? c.getFechaInicio().toString() : "—",
            c.getCliente() != null ? c.getCliente().getNombre() + " " + (c.getCliente().getApellido1() != null ? c.getCliente().getApellido1() : "") : "—",
            c.getEstado() != null ? c.getEstado() : "—",
            c.getTipoContrato() != null ? c.getTipoContrato() : "—"
        )).collect(Collectors.toList());

        byte[] pdf = exporterService.exportToPdf("Listado de Contratos", headers, rows);
        return createResponse(pdf, "listado-contratos.pdf");
    }

    @GetMapping("/intervenciones")
    public ResponseEntity<byte[]> exportIntervenciones() {
        List<Tramite> tramites = tramiteService.findAll();
        List<String> headers = Arrays.asList("ID", "Tipo", "Contrato", "Cliente", "Estado", "Urgente");

        List<List<String>> rows = tramites.stream().map(t -> Arrays.asList(
            String.valueOf(t.getIdTramite()),
            t.getTipoTramite() != null ? t.getTipoTramite() : "—",
            t.getContrato() != null ? String.valueOf(t.getContrato().getIdContrato()) : "—",
            (t.getContrato() != null && t.getContrato().getCliente() != null) ? t.getContrato().getCliente().getNombre() + " " + (t.getContrato().getCliente().getApellido1() != null ? t.getContrato().getCliente().getApellido1() : "") : "—",
            t.getEstado() != null ? t.getEstado() : "Pendiente",
            t.getEsUrgente() != null && t.getEsUrgente() ? "SÍ" : "NO"
        )).collect(Collectors.toList());

        byte[] pdf = exporterService.exportToPdf("Listado de Intervenciones", headers, rows);
        return createResponse(pdf, "listado-intervenciones.pdf");
    }

    @GetMapping("/locales")
    public ResponseEntity<byte[]> exportLocales() {
        List<Local> locales = localService.findAll();
        List<String> headers = Arrays.asList("ID", "Titular", "DNI/CIF", "Dirección", "Referencia Catastral", "CUPS");
        
        List<List<String>> rows = locales.stream().map(l -> Arrays.asList(
            String.valueOf(l.getIdLocal()),
            (l.getNombreTitular() + " " + (l.getApellido1Titular() != null ? l.getApellido1Titular() : "")).trim(),
            l.getDniTitular() != null ? l.getDniTitular() : "—",
            l.getDireccionCompleta() != null ? l.getDireccionCompleta() : "—",
            l.getReferenciaCatastral() != null ? l.getReferenciaCatastral() : "—",
            l.getCups() != null ? l.getCups() : "—"
        )).collect(Collectors.toList());

        byte[] pdf = exporterService.exportToPdf("Listado de Locales", headers, rows);
        return createResponse(pdf, "listado-locales.pdf");
    }

    @GetMapping("/presupuestos")
    public ResponseEntity<byte[]> exportPresupuestos() {
        List<Presupuesto> presupuestos = presupuestoRepository.findAll();
        List<String> headers = Arrays.asList("ID", "Referencia", "Fecha", "Cliente", "Total", "Estado");
        
        List<List<String>> rows = presupuestos.stream().map(p -> Arrays.asList(
            String.valueOf(p.getIdPresupuesto()),
            p.getCodigoReferencia() != null ? p.getCodigoReferencia() : "—",
            p.getFecha() != null ? p.getFecha().toString() : "—",
            p.getCliente() != null ? p.getCliente().getNombre() + " " + (p.getCliente().getApellido1() != null ? p.getCliente().getApellido1() : "") : "—",
            p.getTotalConIva() != null ? p.getTotalConIva().toString() + "€" : "0€",
            p.getEstado() != null ? p.getEstado() : "—"
        )).collect(Collectors.toList());

        byte[] pdf = exporterService.exportToPdf("Listado de Presupuestos", headers, rows);
        return createResponse(pdf, "listado-presupuestos.pdf");
    }

    @GetMapping("/seguimientos")
    public ResponseEntity<byte[]> exportSeguimientos() {
        List<Seguimiento> seguimientos = seguimientoService.findAll();
        List<String> headers = Arrays.asList("ID", "Fecha", "Trámite", "Comentario");
        
        List<List<String>> rows = seguimientos.stream().map(s -> Arrays.asList(
            String.valueOf(s.getIdSeguimiento()),
            s.getFechaSeguimiento() != null ? s.getFechaSeguimiento().toString() : "—",
            s.getTramite() != null ? "T-" + s.getTramite().getIdTramite() : "—",
            s.getComentario() != null ? s.getComentario() : "—"
        )).collect(Collectors.toList());

        byte[] pdf = exporterService.exportToPdf("Listado de Seguimientos", headers, rows);
        return createResponse(pdf, "listado-seguimientos.pdf");
    }

    @GetMapping("/proveedores")
    public ResponseEntity<byte[]> exportProveedores() {
        List<Proveedor> proveedores = proveedorService.findAll();
        List<String> headers = Arrays.asList("ID", "Nombre Comercial", "CIF/NIF", "Teléfono", "Email");
        
        List<List<String>> rows = proveedores.stream().map(p -> {
            String tel = "—";
            String email = "—";
            if (p.getContactos() != null && !p.getContactos().isEmpty()) {
                ProveedorContacto pc = p.getContactos().get(0);
                tel = pc.getTelefono() != null ? pc.getTelefono() : "—";
                email = pc.getEmail() != null ? pc.getEmail() : "—";
            }
            return Arrays.asList(
                String.valueOf(p.getIdProveedor()),
                p.getNombreComercial() != null ? p.getNombreComercial() : "—",
                p.getCif() != null ? p.getCif() : "—",
                tel,
                email
            );
        }).collect(Collectors.toList());

        byte[] pdf = exporterService.exportToPdf("Listado de Proveedores", headers, rows);
        return createResponse(pdf, "listado-proveedores.pdf");
    }

    @GetMapping("/ventas-pendientes")
    public ResponseEntity<byte[]> exportVentasPendientes() {
        List<Tramite> ventas = tramiteService.findVentasPendientes();
        List<String> headers = Arrays.asList("ID", "Tipo", "Contrato", "Cliente", "Fecha Seguimiento", "Urgente");
        
        List<List<String>> rows = ventas.stream().map(t -> Arrays.asList(
            String.valueOf(t.getIdTramite()),
            t.getTipoTramite() != null ? t.getTipoTramite() : "—",
            t.getContrato() != null ? String.valueOf(t.getContrato().getIdContrato()) : "—",
            (t.getContrato() != null && t.getContrato().getCliente() != null) ? t.getContrato().getCliente().getNombre() + " " + (t.getContrato().getCliente().getApellido1() != null ? t.getContrato().getCliente().getApellido1() : "") : "—",
            t.getFechaSeguimiento() != null ? t.getFechaSeguimiento().toString() : "—",
            t.getEsUrgente() != null && t.getEsUrgente() ? "SÍ" : "NO"
        )).collect(Collectors.toList());

        byte[] pdf = exporterService.exportToPdf("Listado de Ventas Pendientes", headers, rows);
        return createResponse(pdf, "listado-ventas-pendientes.pdf");
    }

    private ResponseEntity<byte[]> createResponse(byte[] data, String filename) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", filename);
        return ResponseEntity.ok().headers(headers).body(data);
    }
}
