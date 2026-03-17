package com.ingenieria.service;

import com.ingenieria.dto.LegalizacionRequestDTO;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.interactive.form.PDAcroForm;
import org.apache.pdfbox.pdmodel.interactive.form.PDField;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import java.io.*;
import java.util.HashMap;
import java.util.Map;

/**
 * Servicio para generar la "Memoria Técnica de Instalación Fotovoltaica"
 * a partir de una plantilla PDF con campos de formulario (AcroForms).
 *
 * Estrategia para el mapa de emplazamiento:
 *   1. Coordenadas almacenadas (lat/lon) del Local
 *   2. Catastro API con la referencia catastral (España, muy preciso)
 *   3. Nominatim geocoding con la dirección
 *
 * Fuente de imagen satelital:
 *   1. MapTiler (si la clave tiene acceso a Static Maps)
 *   2. PNOA – Ortofotos del IGN (España, calidad muy alta, sin API key)
 *   3. ArcGIS World Imagery (global, sin API key)
 */
@Service
public class LegalizacionPdfService {

    private static final Logger log = LoggerFactory.getLogger(LegalizacionPdfService.class);
    private static final String TEMPLATE_PATH = "plantilla_legalizacion.pdf";

    public LegalizacionPdfService() {
    }

    // ══════════════════════════════════════════════════════════
    //  GENERACIÓN DEL PDF
    // ══════════════════════════════════════════════════════════

    public byte[] generarLegalizacion(LegalizacionRequestDTO dto) {
        ClassPathResource resource = new ClassPathResource(TEMPLATE_PATH);
        if (!resource.exists()) {
            throw new IllegalStateException("No se encontró la plantilla: " + TEMPLATE_PATH);
        }
        try (InputStream is = resource.getInputStream();
             PDDocument document = PDDocument.load(is);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            PDAcroForm acroForm = document.getDocumentCatalog().getAcroForm();
            if (acroForm == null) {
                throw new IllegalStateException("La plantilla no contiene un formulario AcroForm.");
            }

            Map<String, String> valores = new HashMap<>();
            valores.put("titular",       safe(dto.getTitular()));
            valores.put("nif",           safe(dto.getNif()));
            valores.put("emplazamiento", safe(dto.getEmplazamiento()));
            valores.put("cups",          safe(dto.getCups()));
            valores.put("autoconsumo",   safe(dto.getTipoAutoconsumo()));
            valores.put("caracteristicas", safe(dto.getCaracteristicasTecnicas()));

            for (Map.Entry<String, String> e : valores.entrySet()) {
                PDField f = acroForm.getField(e.getKey());
                if (f == null) { log.info("Campo '{}' no encontrado (ignorado)", e.getKey()); continue; }
                try { f.setValue(e.getValue()); f.setReadOnly(true); }
                catch (Exception ex) { log.warn("No se pudo asignar campo '{}'", e.getKey(), ex); }
            }

            try { acroForm.refreshAppearances(); acroForm.setNeedAppearances(false); }
            catch (Exception ex) { log.warn("No se pudieron refrescar apariencias", ex); }

            acroForm.flatten();

            // Imagen satelital: ELIMINADA por petición del usuario para inserción manual.
            // insertarMapaSatelite(document, dto);

            document.save(baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error generando PDF de legalización.", e);
        }
    }

    private String safe(String v) { return v != null ? v : ""; }

}
