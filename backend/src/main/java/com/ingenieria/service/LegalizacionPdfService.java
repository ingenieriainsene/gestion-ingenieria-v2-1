package com.ingenieria.service;

import com.ingenieria.dto.LegalizacionRequestDTO;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.pdmodel.interactive.form.PDAcroForm;
import org.apache.pdfbox.pdmodel.interactive.form.PDField;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Servicio para generar la "Memoria Técnica de Instalación Fotovoltaica"
 * a partir de una plantilla PDF con campos de formulario (AcroForms).
 *
 * La plantilla debe llamarse {@code plantilla_legalizacion.pdf}
 * y estar situada en {@code src/main/resources}.
 */
@Service
public class LegalizacionPdfService {

    private static final Logger log = LoggerFactory.getLogger(LegalizacionPdfService.class);

    private static final String TEMPLATE_PATH = "plantilla_legalizacion.pdf";

    private final String mapTilerApiKey;

    public LegalizacionPdfService(@Value("${maptiler.api-key:}") String mapTilerApiKey) {
        this.mapTilerApiKey = mapTilerApiKey;
    }

    /**
     * Genera un PDF de legalización rellenando los campos de la plantilla
     * con los valores del DTO y devolviendo el resultado ya "aplastado"
     * (sin campos editables).
     *
     * @param dto datos de la instalación/local a legalizar
     * @return array de bytes del PDF listo para descargar
     */
    public byte[] generarLegalizacion(LegalizacionRequestDTO dto) {
        ClassPathResource resource = new ClassPathResource(TEMPLATE_PATH);

        if (!resource.exists()) {
            throw new IllegalStateException("No se encontró la plantilla de legalización: " + TEMPLATE_PATH);
        }

        try (InputStream is = resource.getInputStream();
             PDDocument document = PDDocument.load(is);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            PDAcroForm acroForm = document.getDocumentCatalog().getAcroForm();
            if (acroForm == null) {
                throw new IllegalStateException("La plantilla de legalización no contiene un formulario AcroForm.");
            }

            // Mapa de nombreCampoPDF -> valor
            Map<String, String> valores = new HashMap<>();
            valores.put("titular", safe(dto.getTitular()));
            valores.put("nif", safe(dto.getNif()));
            valores.put("emplazamiento", safe(dto.getEmplazamiento()));
            valores.put("cups", safe(dto.getCups()));
            valores.put("autoconsumo", safe(dto.getTipoAutoconsumo()));
            valores.put("caracteristicas", safe(dto.getCaracteristicasTecnicas()));

            for (Map.Entry<String, String> entry : valores.entrySet()) {
                String fieldName = entry.getKey();
                String value = entry.getValue();
                PDField field = acroForm.getField(fieldName);
                if (field == null) {
                    log.info("Campo '{}' no encontrado en plantilla_legalizacion.pdf (se ignora)", fieldName);
                    continue;
                }
                try {
                    field.setValue(value);
                    field.setReadOnly(true);
                } catch (Exception e) {
                    log.warn("No se pudo asignar valor al campo '{}' en la plantilla de legalización", fieldName, e);
                }
            }

            // Forzamos la regeneración de apariencias para evitar que se vea el nombre del campo
            try {
                acroForm.refreshAppearances();
                acroForm.setNeedAppearances(false);
            } catch (Exception e) {
                log.warn("No se pudieron refrescar las apariencias del AcroForm", e);
            }

            // "Aplastar" el formulario para que el PDF ya no sea editable.
            acroForm.flatten();

            // Inserción opcional del mapa satélite en la última página
            insertarMapaSatélite(document, dto);

            document.save(baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error al generar el PDF de legalización.", e);
        }
    }

    private String safe(String value) {
        return value != null ? value : "";
    }

    /**
     * Descarga una imagen de Google Static Maps usando las coordenadas del DTO
     * y la clave configurada en application.properties.
     */
    private byte[] descargarMapa(LegalizacionRequestDTO dto) {
        if (mapTilerApiKey == null || mapTilerApiKey.isBlank()) {
            log.info("maptiler.api-key no configurada; se omite la descarga del mapa satélite.");
            return null;
        }
        if (dto.getLatitud() == null || dto.getLongitud() == null) {
            log.info("Latitud/longitud no informadas en la petición de legalización; no se genera mapa satélite.");
            return null;
        }

        try {
            // MapTiler usa el orden LONGITUD,LATITUD (x,y)
            Double lat = dto.getLatitud();
            Double lon = dto.getLongitud();
            String coords = lon + "," + lat;
            String encodedCoords = URLEncoder.encode(coords, StandardCharsets.UTF_8);

            String url = "https://api.maptiler.com/maps/satellite/static/" +
                    encodedCoords + ",18/600x400.jpg?key=" +
                    URLEncoder.encode(mapTilerApiKey, StandardCharsets.UTF_8);

            log.info("Descargando mapa satélite de MapTiler para legalización: {}", url);

            RestTemplate restTemplate = new RestTemplate();
            return restTemplate.getForObject(url, byte[].class);
        } catch (Exception e) {
            log.warn("No se pudo descargar la imagen de Google Static Maps para la legalización.", e);
            return null;
        }
    }

    /**
     * Inserta la imagen de satélite en la última página del PDF, si se ha podido descargar.
     */
    private void insertarMapaSatélite(PDDocument document, LegalizacionRequestDTO dto) {
        byte[] imgBytes = descargarMapa(dto);
        if (imgBytes == null || imgBytes.length == 0) {
            return;
        }

        try {
            PDImageXObject image = PDImageXObject.createFromByteArray(document, imgBytes, "mapa_satellite");

            int lastIndex = document.getNumberOfPages() - 1;
            if (lastIndex < 0) return;

            PDPage page = document.getPage(lastIndex);

            float imageWidth = 400f;
            float imageHeight = 260f;
            float x = 100f;
            float y = 300f;

            try (PDPageContentStream contentStream = new PDPageContentStream(
                    document,
                    page,
                    PDPageContentStream.AppendMode.APPEND,
                    true,
                    true)) {
                contentStream.drawImage(image, x, y, imageWidth, imageHeight);
            }
        } catch (Exception e) {
            log.warn("No se pudo insertar la imagen de satélite en el PDF de legalización.", e);
        }
    }
}

