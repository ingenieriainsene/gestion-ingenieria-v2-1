package com.ingenieria.service;

import com.ingenieria.model.AlbaranVenta;
import com.ingenieria.model.AlbaranVentaLinea;
import com.ingenieria.model.Cliente;
import com.ingenieria.model.FacturaVenta;
import com.ingenieria.model.Local;
import com.ingenieria.model.Presupuesto;
import com.ingenieria.model.PresupuestoLinea;
import com.ingenieria.model.Tramite;
import com.ingenieria.repository.AlbaranVentaRepository;
import com.ingenieria.repository.AlbaranVentaLineaRepository;
import com.ingenieria.repository.PresupuestoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StreamUtils;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DocumentoPdfService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final SpringTemplateEngine templateEngine;
    private final PresupuestoRepository presupuestoRepository;
    private final AlbaranVentaService albaranVentaService;
    private final FacturaVentaService facturaVentaService;
    private final AlbaranVentaRepository albaranVentaRepository;
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
                observacionesAlbaran(albaran.getNotas()),
                legalGenerico(),
                resolverContratoId(albaran, p),
                resolverIntervencionId(albaran, p));

        return renderDocumento(doc, p, lineasAlbaran);
    }

    @Transactional(readOnly = true)
    public byte[] generarAlbaranPdfPorId(Long albaranId) {
        AlbaranVenta albaran = albaranVentaRepository.findById(albaranId)
                .orElseThrow(() -> new IllegalArgumentException("Albarán no encontrado"));
        List<AlbaranVentaLinea> lineasAlbaran = albaranVentaLineaRepository
                .findByAlbaran_IdAlbaranOrderByOrdenAsc(albaran.getIdAlbaran());

        Presupuesto p;
        if (albaran.getPresupuesto() != null) {
            Long presupuestoId = albaran.getPresupuesto().getIdPresupuesto();
            p = presupuestoRepository.findByIdWithLineas(presupuestoId)
                    .orElseThrow(() -> new IllegalArgumentException("Presupuesto no encontrado"));
        } else {
            p = construirPresupuestoVirtual(albaran, lineasAlbaran);
        }

        DocumentoData doc = new DocumentoData(
                "Albarán de venta",
                "ALBARÁN",
                albaran.getNumeroAlbaran(),
                formatDate(albaran.getFecha()),
                refAlbaran(albaran, p),
                observacionesAlbaran(albaran.getNotas()),
                legalGenerico(),
                resolverContratoId(albaran, p),
                resolverIntervencionId(albaran, p));
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
                "Sin observaciones.",
                "Factura emitida conforme a la normativa vigente. El impago puede generar recargos.",
                null,
                null);

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
                "INSENE SOLAR S.L.U",
                "B90065483",
                "Herreros 20-22, 41510 Mairena del Alcor, Sevilla",
                "administracion@insene.es",
                "954022496");
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
                            formatPercent(BigDecimal.ZERO),
                            formatPercent(safe(l.getIvaPorcentaje())),
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
                    formatPercent(BigDecimal.ZERO),
                    formatPercent(safe(l.getIvaPorcentaje())),
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
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(html);
            renderer.layout();
            renderer.createPDF(baos);
            return baos.toByteArray();
        } catch (Exception e) {
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

    private String refAlbaran(AlbaranVenta a, Presupuesto p) {
        if (p != null && p.getIdPresupuesto() != null) {
            return refPresupuesto(p);
        }
        if (a.getTramite() != null && a.getTramite().getIdTramite() != null) {
            return "Intervención #" + a.getTramite().getIdTramite();
        }
        return "Albarán #" + a.getIdAlbaran();
    }

    private String observacionesAlbaran(String notas) {
        if (notas == null || notas.isBlank()) {
            return "Sin observaciones.";
        }
        return notas.trim();
    }

    private String legalGenerico() {
        return "Los datos de carácter personal presentes en este documento han sido recogidos de acuerdo con lo dispuesto en la Ley Orgánica de Protección de Datos y normativa vigente. Puede ejercer sus derechos de acceso, rectificación, cancelación y oposición mediante comunicación escrita a la dirección de la empresa.";
    }

    private Presupuesto construirPresupuestoVirtual(AlbaranVenta a, List<AlbaranVentaLinea> lineas) {
        Presupuesto p = new Presupuesto();
        Tramite t = a.getTramite();
        if (t != null && t.getContrato() != null) {
            p.setCliente(t.getContrato().getCliente());
            p.setVivienda(t.getContrato().getLocal());
        }
        p.setCodigoReferencia("ALB-MANUAL-" + a.getIdAlbaran());
        p.setFecha(a.getFecha());
        BigDecimal total = BigDecimal.ZERO;
        for (AlbaranVentaLinea l : lineas) {
            total = total.add(safe(l.getTotalConIva()));
        }
        p.setTotalConIva(round2(total));
        p.setTotalSinIva(BigDecimal.ZERO);
        return p;
    }

    private Long resolverIntervencionId(AlbaranVenta albaran, Presupuesto p) {
        if (albaran != null && albaran.getTramite() != null && albaran.getTramite().getIdTramite() != null) {
            return albaran.getTramite().getIdTramite();
        }
        if (p != null && p.getTramite() != null && p.getTramite().getIdTramite() != null) {
            return p.getTramite().getIdTramite();
        }
        return null;
    }

    private Long resolverContratoId(AlbaranVenta albaran, Presupuesto p) {
        if (albaran != null
                && albaran.getTramite() != null
                && albaran.getTramite().getContrato() != null
                && albaran.getTramite().getContrato().getIdContrato() != null) {
            return albaran.getTramite().getContrato().getIdContrato();
        }
        if (p != null
                && p.getTramite() != null
                && p.getTramite().getContrato() != null
                && p.getTramite().getContrato().getIdContrato() != null) {
            return p.getTramite().getContrato().getIdContrato();
        }
        return null;
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
        return formatNumber(value, 2) + " €";
    }

    private String formatDecimal(BigDecimal value) {
        return formatNumber(value, 2);
    }

    private String formatPercent(BigDecimal value) {
        return formatNumber(value, 2) + "%";
    }

    private String formatNumber(BigDecimal value, int decimals) {
        BigDecimal rounded = round2(value);
        String pattern = decimals <= 0 ? "#,##0" : "#,##0." + "0".repeat(decimals);
        DecimalFormatSymbols symbols = DecimalFormatSymbols.getInstance(Locale.forLanguageTag("es-ES"));
        DecimalFormat fmt = new DecimalFormat(pattern, symbols);
        fmt.setGroupingUsed(true);
        return fmt.format(rounded);
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

    public record LineaData(String concepto, String cantidad, String precioUnitario, String descuento, String iva,
            String total) {
    }

    public record TotalesData(String subtotal, String iva, String total) {
    }

    public record DocumentoData(String titulo, String tipo, String numero, String fecha, String referencia,
            String observaciones, String legal, Long contratoId, Long intervencionId) {
    }
}
