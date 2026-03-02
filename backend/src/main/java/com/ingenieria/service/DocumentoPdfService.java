package com.ingenieria.service;

import com.ingenieria.model.AlbaranVenta;
import com.ingenieria.model.AlbaranVentaLinea;
import com.ingenieria.model.Cliente;
import com.ingenieria.model.FacturaVenta;
import com.ingenieria.model.Local;
import com.ingenieria.model.Presupuesto;
import com.ingenieria.model.PresupuestoLinea;
import com.ingenieria.repository.AlbaranVentaLineaRepository;
import com.ingenieria.repository.PresupuestoRepository;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.PageSize;
import com.lowagie.text.html.simpleparser.HTMLWorker;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.io.ByteArrayOutputStream;
import java.io.StringReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DocumentoPdfService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final SpringTemplateEngine templateEngine;
    private final PresupuestoRepository presupuestoRepository;
    private final AlbaranVentaService albaranVentaService;
    private final FacturaVentaService facturaVentaService;
    private final AlbaranVentaLineaRepository albaranVentaLineaRepository;

    public byte[] generarAlbaranPdf(Long presupuestoId, String usuarioBd) {
        AlbaranVenta albaran = albaranVentaService.obtenerOCrear(presupuestoId, usuarioBd);
        Presupuesto p = presupuestoRepository.findByIdWithLineas(presupuestoId)
                .orElseThrow(() -> new IllegalArgumentException("Presupuesto no encontrado"));

        List<AlbaranVentaLinea> lineasAlbaran = albaranVentaLineaRepository
                .findByAlbaran_IdAlbaranOrderByOrdenAsc(albaran.getIdAlbaran());

        DocumentoData doc = new DocumentoData(
                "Albarán de venta",
                "ALBARÁN",
                albaran.getNumeroAlbaran(),
                formatDate(albaran.getFecha()),
                refPresupuesto(p),
                "Documento válido como albarán de entrega. La factura será emitida según condiciones acordadas.");

        return renderDocumento(doc, p, lineasAlbaran);
    }

    public byte[] generarFacturaPdf(Long presupuestoId, String usuarioBd) {
        FacturaVenta factura = facturaVentaService.obtenerOCrear(presupuestoId, usuarioBd);
        Presupuesto p = presupuestoRepository.findByIdWithLineas(presupuestoId)
                .orElseThrow(() -> new IllegalArgumentException("Presupuesto no encontrado"));

        DocumentoData doc = new DocumentoData(
                "Factura de venta",
                "FACTURA",
                factura.getNumeroFactura(),
                formatDate(factura.getFecha()),
                refPresupuesto(p),
                "Factura emitida conforme a la normativa vigente. El impago puede generar recargos.");

        return renderDocumento(doc, p, null);
    }

    private byte[] renderDocumento(DocumentoData doc, Presupuesto p, List<AlbaranVentaLinea> lineasAlbaran) {
        Context ctx = new Context();
        ctx.setVariable("documento", doc);
        ctx.setVariable("empresa", buildEmpresa());
        ctx.setVariable("cliente", buildCliente(p.getCliente(), p.getVivienda()));
        ctx.setVariable("lineas", buildLineas(p, lineasAlbaran));
        ctx.setVariable("totales", buildTotales(p, lineasAlbaran));
        ctx.setVariable("logoBase64", loadLogoBase64().orElse(null));

        String html = templateEngine.process("documento-template", ctx);
        return htmlToPdf(html);
    }

    private EmpresaData buildEmpresa() {
        return new EmpresaData(
                "INSENE SOLAR",
                "B-00000000",
                "Av. Innovación 12, Sevilla",
                "info@insene-solar.com",
                "+34 900 000 000");
    }

    private ClienteData buildCliente(Cliente c, Local l) {
        String nombre = c != null ? buildClienteNombre(c) : "—";
        String dni = c != null ? safe(c.getDni()) : "—";
        String direccion = l != null ? safe(l.getDireccionCompleta()) : (c != null ? safe(c.getDireccionFiscalCompleta()) : "—");
        String email = c != null ? safe(c.getEmail()) : "—";
        return new ClienteData(nombre, dni, direccion, email);
    }

    private List<LineaData> buildLineas(Presupuesto p, List<AlbaranVentaLinea> lineasAlbaran) {
        if (lineasAlbaran != null && !lineasAlbaran.isEmpty()) {
            return lineasAlbaran.stream()
                    .map(l -> new LineaData(
                            l.getConcepto(),
                            formatDecimal(safe(l.getCantidad())),
                            formatMoney(safe(l.getPrecioUnitario())),
                            formatMoney(safe(l.getTotalConIva()))))
                    .toList();
        }
        List<LineaData> result = new ArrayList<>();
        if (p == null || p.getLineas() == null) {
            return result;
        }
        List<PresupuestoLinea> lineas = new ArrayList<>(p.getLineas());
        lineas.sort(Comparator
                .comparing(PresupuestoLinea::getCodigoVisual, Comparator.nullsLast(String::compareTo))
                .thenComparing(PresupuestoLinea::getOrden, Comparator.nullsLast(Integer::compareTo)));

        for (PresupuestoLinea l : lineas) {
            if (l == null || !"PARTIDA".equalsIgnoreCase(l.getTipoJerarquia())) {
                continue;
            }
            String concepto = l.getProductoTexto() != null && !l.getProductoTexto().isBlank()
                    ? l.getProductoTexto()
                    : (l.getConcepto() != null ? l.getConcepto() : "—");
            if (l.getCodigoVisual() != null) {
                concepto = l.getCodigoVisual() + " " + concepto;
            }
            BigDecimal cantidad = safe(l.getCantidad());
            BigDecimal precio = safe(l.getPvpUnitario() != null ? l.getPvpUnitario() : l.getPrecioUnitario());
            BigDecimal total = calcularBaseLinea(l);

            result.add(new LineaData(
                    concepto,
                    formatDecimal(cantidad),
                    formatMoney(precio),
                    formatMoney(total)));
        }
        return result;
    }

    private TotalesData buildTotales(Presupuesto p, List<AlbaranVentaLinea> lineasAlbaran) {
        if (lineasAlbaran != null && !lineasAlbaran.isEmpty()) {
            BigDecimal subtotal = BigDecimal.ZERO;
            BigDecimal iva = BigDecimal.ZERO;
            BigDecimal total = BigDecimal.ZERO;
            for (AlbaranVentaLinea l : lineasAlbaran) {
                subtotal = subtotal.add(safe(l.getTotalLinea()));
                iva = iva.add(safe(l.getTotalIva()));
                total = total.add(safe(l.getTotalConIva()));
            }
            return new TotalesData(formatMoney(subtotal), formatMoney(iva), formatMoney(total));
        }
        BigDecimal subtotal = p != null && p.getTotalSinIva() != null ? p.getTotalSinIva() : BigDecimal.ZERO;
        BigDecimal total = p != null && p.getTotalConIva() != null ? p.getTotalConIva()
                : (p != null && p.getTotal() != null ? p.getTotal() : BigDecimal.ZERO);
        BigDecimal iva = total.subtract(subtotal);
        return new TotalesData(formatMoney(subtotal), formatMoney(iva), formatMoney(total));
    }

    private byte[] htmlToPdf(String html) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, baos);
            document.open();
            HTMLWorker worker = new HTMLWorker(document);
            worker.parse(new StringReader(html));
            document.close();
            return baos.toByteArray();
        } catch (DocumentException | java.io.IOException e) {
            throw new RuntimeException("No se pudo generar el PDF", e);
        }
    }

    private Optional<String> loadLogoBase64() {
        try {
            ClassPathResource imgFile = new ClassPathResource("static/images/logo.png");
            byte[] bytes = StreamUtils.copyToByteArray(imgFile.getInputStream());
            return Optional.of(java.util.Base64.getEncoder().encodeToString(bytes));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private String buildClienteNombre(Cliente c) {
        if (c == null) {
            return "—";
        }
        String nombre = safe(c.getNombre());
        String ap1 = safe(c.getApellido1());
        String ap2 = c.getApellido2() != null ? " " + c.getApellido2() : "";
        return (nombre + " " + ap1 + ap2).trim();
    }

    private String refPresupuesto(Presupuesto p) {
        if (p == null) {
            return "—";
        }
        String ref = p.getCodigoReferencia();
        if (ref == null || ref.isBlank()) {
            return "Presupuesto #" + p.getIdPresupuesto();
        }
        return ref;
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

    private String formatDate(LocalDate date) {
        if (date == null) {
            return "—";
        }
        return date.format(DATE_FMT);
    }

    private String formatMoney(BigDecimal value) {
        return round2(value).toPlainString() + " €";
    }

    private String formatDecimal(BigDecimal value) {
        return round2(value).toPlainString();
    }

    private BigDecimal round2(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal safe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private String safe(String value) {
        return value != null ? value : "—";
    }

    public record EmpresaData(String nombre, String cif, String direccion, String email, String telefono) {
    }

    public record ClienteData(String nombre, String dni, String direccion, String email) {
    }

    public record LineaData(String concepto, String cantidad, String precioUnitario, String total) {
    }

    public record TotalesData(String subtotal, String iva, String total) {
    }

    public record DocumentoData(String titulo, String tipo, String numero, String fecha, String referencia, String legal) {
    }
}
