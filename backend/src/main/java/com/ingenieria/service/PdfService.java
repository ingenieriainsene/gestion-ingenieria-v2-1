package com.ingenieria.service;

import com.ingenieria.model.Presupuesto;
import com.ingenieria.model.PresupuestoLinea;
import com.ingenieria.model.Cliente;
import com.ingenieria.model.Local;
import com.ingenieria.repository.PresupuestoRepository;
import com.lowagie.text.*;
import com.lowagie.text.Image;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.util.StreamUtils;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PdfService {

    private static final Logger log = LoggerFactory.getLogger(PdfService.class);

    @Autowired
    private PresupuestoRepository presupuestoRepository;

    private static final Color COLOR_PRIMARY = new Color(15, 23, 42);
    private static final Color COLOR_LIGHT = new Color(241, 245, 249);
    private static final Font FONT_TITLE = new Font(Font.HELVETICA, 14, Font.BOLD, COLOR_PRIMARY);
    private static final Font FONT_LABEL = new Font(Font.HELVETICA, 9, Font.BOLD, new Color(71, 85, 105));
    private static final Font FONT_TEXT = new Font(Font.HELVETICA, 10, Font.NORMAL, COLOR_PRIMARY);
    private static final Font FONT_TABLE_HEADER = new Font(Font.HELVETICA, 9, Font.BOLD, Color.WHITE);

    public byte[] generarPresupuestoPdf(Long id) {
        Presupuesto p = presupuestoRepository.findByIdWithLineas(id)
                .orElseThrow(() -> new IllegalArgumentException("Presupuesto no encontrado"));

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, baos);
            document.open();

            addHeader(document, p);
            addLineasTable(document, p);
            addTotales(document, p);
            addFooter(document);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("No se pudo generar el PDF", e);
        }
    }

    private void addHeader(Document document, Presupuesto p) throws DocumentException {
        PdfPTable header = new PdfPTable(2);
        header.setWidthPercentage(100);
        header.setWidths(new float[] { 1.2f, 1.8f });

        PdfPCell left = new PdfPCell();
        left.setBorder(Rectangle.NO_BORDER);
        left.setHorizontalAlignment(Element.ALIGN_LEFT);
        left.setVerticalAlignment(Element.ALIGN_MIDDLE);
        try {
            ClassPathResource imgFile = new ClassPathResource("static/images/logo.png");
            byte[] bytes = StreamUtils.copyToByteArray(imgFile.getInputStream());
            Image logo = Image.getInstance(bytes);
            logo.scaleToFit(140, 70);
            logo.setAlignment(Element.ALIGN_LEFT);
            left.addElement(logo);
        } catch (Exception e) {
            log.error("No se pudo cargar el logo del PDF", e);
            left.addElement(new Phrase("INSENE ENERGÍA", FONT_TITLE));
        }

        PdfPCell right = new PdfPCell();
        right.setBorder(Rectangle.NO_BORDER);
        right.setHorizontalAlignment(Element.ALIGN_RIGHT);
        right.setVerticalAlignment(Element.ALIGN_MIDDLE);
        right.addElement(new Paragraph("INSENE SOLAR", FONT_TITLE));
        right.addElement(new Paragraph("Instalaciones Fotovoltaicas", FONT_TEXT));
        right.addElement(new Paragraph("Tipo presupuesto: " + resolveTipo(p), FONT_TEXT));
        right.addElement(new Paragraph("CIF: B-00000000", FONT_TEXT));
        right.addElement(new Paragraph("info@insene-solar.com", FONT_TEXT));

        header.addCell(left);
        header.addCell(right);

        document.add(header);
        document.add(Chunk.NEWLINE);

        PdfPTable meta = new PdfPTable(1);
        meta.setWidthPercentage(100);
        PdfPCell metaCell = new PdfPCell();
        metaCell.setBorder(Rectangle.NO_BORDER);
        metaCell.addElement(new Paragraph("Presupuesto #" + p.getIdPresupuesto(), FONT_LABEL));
        metaCell.addElement(new Paragraph("TIPO DE PRESUPUESTO: " + resolveTipo(p).toUpperCase(), FONT_LABEL));
        metaCell.addElement(new Paragraph("Fecha: " + formatDate(p), FONT_TEXT));
        metaCell.addElement(new Paragraph("Cliente: " + buildClienteNombre(p.getCliente()), FONT_TEXT));
        metaCell.addElement(new Paragraph("Vivienda: " + buildVivienda(p.getVivienda()), FONT_TEXT));
        meta.addCell(metaCell);
        document.add(meta);
        document.add(Chunk.NEWLINE);
    }

    private String resolveTipo(Presupuesto p) {
        if (p == null)
            return "Obra";
        String tipo = p.getTipoPresupuesto();
        if (tipo == null || tipo.isBlank())
            return "Obra";
        return tipo.trim();
    }

    private void addLineasTable(Document document, Presupuesto p) throws DocumentException {
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setWidths(new float[] { 3.6f, 0.8f, 1.2f, 1.2f });

        addHeaderCell(table, "CONCEPTO");
        addHeaderCell(table, "CANT.");
        addHeaderCell(table, "PVP UNIT.");
        addHeaderCell(table, "TOTAL");

        java.util.List<PresupuestoLinea> lineas = new java.util.ArrayList<>(p.getLineas());
        List<PresupuestoLinea> roots = buildTree(lineas);
        for (PresupuestoLinea l : roots) {
            if ("CAPITULO".equals(l.getTipoJerarquia())) {
                String capitulo = (l.getCodigoVisual() != null ? l.getCodigoVisual() + " " : "") +
                        (l.getConcepto() != null ? l.getConcepto() : "—");
                BigDecimal capTotal = sumarCapituloBase(l);
                addBodyCellBold(table, capitulo);
                addBodyCell(table, "—");
                addBodyCell(table, "—");
                addBodyCellBold(table, formatMoney(capTotal));
            } else {
                // Si es una partida raíz (fuera de capítulos), la mostramos
                addPartidaRow(table, l);
            }
        }

        document.add(table);
        document.add(Chunk.NEWLINE);
    }

    private void addTotales(Document document, Presupuesto p) throws DocumentException {
        BigDecimal totalSinIva = BigDecimal.ZERO;
        BigDecimal totalIva = BigDecimal.ZERO;
        BigDecimal totalConIva = BigDecimal.ZERO;

        // Mapa para desglose de IVA por tipos (p.ej. 21%, 10%)
        Map<BigDecimal, BigDecimal> basesPorIva = new HashMap<>();

        java.util.Collection<PresupuestoLinea> lineas = p.getLineas();
        if (lineas != null) {
            for (PresupuestoLinea l : lineas) {
                if ("CAPITULO".equals(l.getTipoJerarquia())) {
                    continue;
                }
                BigDecimal base = calcularBaseLinea(l);
                BigDecimal ivaPct = l.getIvaPorcentaje() != null ? l.getIvaPorcentaje() : BigDecimal.valueOf(21);

                totalSinIva = totalSinIva.add(base);
                basesPorIva.put(ivaPct, basesPorIva.getOrDefault(ivaPct, BigDecimal.ZERO).add(base));
            }
        }

        PdfPTable totalsTable = new PdfPTable(2);
        totalsTable.setWidthPercentage(45);
        totalsTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalsTable.setWidths(new float[] { 1.5f, 1f });

        // Añadir desglose por cada tipo de IVA
        List<BigDecimal> tipos = new ArrayList<>(basesPorIva.keySet());
        tipos.sort(Comparator.reverseOrder());

        for (BigDecimal pct : tipos) {
            BigDecimal base = basesPorIva.get(pct);
            BigDecimal cuota = round2(base.multiply(pct).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
            totalIva = totalIva.add(cuota);

            addTotalsRow(totalsTable, "Base Imponible " + pct + "%", formatMoney(round2(base)));
            addTotalsRow(totalsTable, "IVA " + pct + "%", formatMoney(cuota));
        }

        totalConIva = totalSinIva.add(totalIva);

        // Fila divisoria
        PdfPCell separator = new PdfPCell(new Phrase(" "));
        separator.setBorder(Rectangle.TOP);
        separator.setColspan(2);
        separator.setFixedHeight(2);
        totalsTable.addCell(separator);

        addTotalsRowBold(totalsTable, "TOTAL PRESUPUESTO", formatMoney(round2(totalConIva)));

        document.add(totalsTable);
        document.add(Chunk.NEWLINE);
    }

    private void addTotalsRowBold(PdfPTable table, String label, String value) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, FONT_TITLE));
        c1.setBorder(Rectangle.NO_BORDER);
        c1.setHorizontalAlignment(Element.ALIGN_RIGHT);
        c1.setPadding(4);
        PdfPCell c2 = new PdfPCell(new Phrase(value, FONT_TITLE));
        c2.setBorder(Rectangle.NO_BORDER);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        c2.setPadding(4);
        table.addCell(c1);
        table.addCell(c2);
    }

    private void addFooter(Document document) throws DocumentException {
        Paragraph footer = new Paragraph("Documento válido por 15 días.", FONT_LABEL);
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);
    }

    private void addHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FONT_TABLE_HEADER));
        cell.setBackgroundColor(COLOR_PRIMARY);
        cell.setBorderColor(Color.WHITE);
        cell.setPadding(8);
        table.addCell(cell);
    }

    private void addBodyCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FONT_TEXT));
        cell.setBackgroundColor(Color.WHITE);
        cell.setBorderColor(COLOR_LIGHT);
        cell.setPadding(8);
        table.addCell(cell);
    }

    private void addBodyCellBold(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FONT_LABEL));
        cell.setBackgroundColor(Color.WHITE);
        cell.setBorderColor(COLOR_LIGHT);
        cell.setPadding(8);
        table.addCell(cell);
    }

    private void addPartidaRow(PdfPTable table, PresupuestoLinea l) {
        String concepto = l.getProductoTexto() != null && !l.getProductoTexto().isBlank()
                ? l.getProductoTexto()
                : (l.getConcepto() != null ? l.getConcepto() : "—");
        if (l.getCodigoVisual() != null) {
            concepto = l.getCodigoVisual() + " " + concepto;
        }
        BigDecimal cantidad = safe(l.getCantidad());
        BigDecimal precio = safe(l.getPvpUnitario() != null ? l.getPvpUnitario() : l.getPrecioUnitario());
        BigDecimal base = calcularBaseLinea(l);

        addBodyCell(table, "   " + concepto);
        addBodyCell(table, formatDecimal(cantidad));
        addBodyCell(table, formatMoney(precio));
        addBodyCell(table, formatMoney(base));
    }

    private BigDecimal sumarCapituloBase(PresupuestoLinea capitulo) {
        BigDecimal total = BigDecimal.ZERO;
        for (PresupuestoLinea h : capitulo.getHijos()) {
            if ("CAPITULO".equals(h.getTipoJerarquia())) {
                total = total.add(sumarCapituloBase(h));
            } else {
                total = total.add(calcularBaseLinea(h));
            }
        }
        return round2(total);
    }

    private List<PresupuestoLinea> buildTree(List<PresupuestoLinea> lineas) {
        if (lineas == null)
            return List.of();
        Map<Long, PresupuestoLinea> byId = new HashMap<>();
        for (PresupuestoLinea l : lineas) {
            l.setHijos(new ArrayList<>());
            if (l.getIdLinea() != null) {
                byId.put(l.getIdLinea(), l);
            }
        }

        List<PresupuestoLinea> roots = new ArrayList<>();
        for (PresupuestoLinea l : lineas) {
            PresupuestoLinea padre = l.getPadre();
            if (padre != null && padre.getIdLinea() != null && byId.containsKey(padre.getIdLinea())) {
                byId.get(padre.getIdLinea()).getHijos().add(l);
            } else {
                roots.add(l);
            }
        }

        sortTree(roots);
        return roots;
    }

    private void sortTree(List<PresupuestoLinea> nodes) {
        nodes.sort(Comparator
                .comparing(PresupuestoLinea::getCodigoVisual, Comparator.nullsLast(String::compareTo))
                .thenComparing(PresupuestoLinea::getOrden, Comparator.nullsLast(Integer::compareTo)));
        for (PresupuestoLinea n : nodes) {
            sortTree(n.getHijos());
        }
    }

    private void addTotalsRow(PdfPTable table, String label, String value) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, FONT_LABEL));
        c1.setBorder(Rectangle.NO_BORDER);
        c1.setHorizontalAlignment(Element.ALIGN_RIGHT);
        c1.setPadding(4);
        PdfPCell c2 = new PdfPCell(new Phrase(value, FONT_TEXT));
        c2.setBorder(Rectangle.NO_BORDER);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        c2.setPadding(4);
        table.addCell(c1);
        table.addCell(c2);
    }

    private String buildClienteNombre(Cliente c) {
        if (c == null)
            return "—";
        String nombre = c.getNombre() != null ? c.getNombre() : "";
        String ap1 = c.getApellido1() != null ? c.getApellido1() : "";
        String ap2 = c.getApellido2() != null ? " " + c.getApellido2() : "";
        return (nombre + " " + ap1 + ap2).trim();
    }

    private String buildVivienda(Local l) {
        if (l == null)
            return "—";
        return l.getDireccionCompleta() != null ? l.getDireccionCompleta() : "—";
    }

    private String formatDate(Presupuesto p) {
        if (p.getFecha() == null)
            return "—";
        return p.getFecha().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }

    private BigDecimal calcularBaseLinea(PresupuestoLinea l) {
        if (l.getTotalPvp() != null)
            return round2(l.getTotalPvp());
        if (l.getTotalLinea() != null)
            return round2(l.getTotalLinea());
        BigDecimal qty = safe(l.getCantidad());
        BigDecimal pu = safe(l.getPvpUnitario() != null ? l.getPvpUnitario() : l.getPrecioUnitario());
        return round2(qty.multiply(pu));
    }

    private BigDecimal calcularTotalConIva(BigDecimal base, BigDecimal ivaPct) {
        BigDecimal iva = round2(base.multiply(ivaPct).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
        return round2(base.add(iva));
    }

    private BigDecimal safe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private BigDecimal round2(BigDecimal value) {
        if (value == null)
            return BigDecimal.ZERO;
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private String formatMoney(BigDecimal value) {
        return round2(value).toPlainString() + " €";
    }

    private String formatDecimal(BigDecimal value) {
        return round2(value).toPlainString();
    }
}
