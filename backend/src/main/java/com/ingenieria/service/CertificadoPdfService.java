package com.ingenieria.service;

import com.ingenieria.dto.CieRequestDTO;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDResources;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.interactive.form.PDAcroForm;
import org.apache.pdfbox.pdmodel.interactive.form.PDCheckBox;
import org.apache.pdfbox.pdmodel.interactive.form.PDField;
import org.apache.pdfbox.pdmodel.interactive.form.PDVariableText;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Method;

@Service
public class CertificadoPdfService {

    private static final Logger log = LoggerFactory.getLogger(CertificadoPdfService.class);

    private static final String TEMPLATE_PATH = "CERTIFICADO 1699 firmado.pdf";
    private static final String FONT_PATH = "arial.ttf";

    public byte[] generarCertificado(CieRequestDTO dto) {
        ClassPathResource pdfResource = new ClassPathResource(TEMPLATE_PATH);
        ClassPathResource fontResource = new ClassPathResource(FONT_PATH);

        if (!pdfResource.exists()) {
            throw new IllegalStateException("No se encontró la plantilla del Certificado: " + TEMPLATE_PATH);
        }

        try (InputStream isPdf = pdfResource.getInputStream();
             PDDocument document = PDDocument.load(isPdf);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            PDAcroForm acroForm = document.getDocumentCatalog().getAcroForm();
            if (acroForm == null) {
                // Si el PDF no tiene formulario, devolvemos el original por ahora
                // para evitar que la aplicación falle, aunque no se rellene nada.
                log.warn("La plantilla {} no contiene un formulario AcroForm.", TEMPLATE_PATH);
                document.save(baos);
                return baos.toByteArray();
            }

            // Cargar fuente si existe
            if (fontResource.exists()) {
                try (InputStream isFont = fontResource.getInputStream()) {
                    PDType0Font customFont = PDType0Font.load(document, isFont);
                    PDResources res = acroForm.getDefaultResources();
                    if (res == null) {
                        res = new PDResources();
                        acroForm.setDefaultResources(res);
                    }
                    String fontName = res.add(customFont).getName();
                    String defaultAppearance = "/" + fontName + " 10 Tf 0 0 0 rg"; // Negro

                    for (PDField field : acroForm.getFieldTree()) {
                        if (field instanceof PDVariableText) {
                            ((PDVariableText) field).setDefaultAppearance(defaultAppearance);
                        }
                    }
                } catch (Exception e) {
                    log.warn("No se pudo cargar la fuente arial.ttf, se usará la por defecto", e);
                }
            }

            // Mapeo automático de los campos de texto del DTO
            mapDtoFieldsToAcroForm(dto, acroForm);

            // "Aplastar" el formulario
            acroForm.flatten();

            document.save(baos);
            return baos.toByteArray();

        } catch (IOException e) {
            log.error("Error al generar el PDF del Certificado.", e);
            throw new RuntimeException("Error al generar el PDF del Certificado.", e);
        }
    }

    private void mapDtoFieldsToAcroForm(CieRequestDTO dto, PDAcroForm acroForm) {
        for (Method method : CieRequestDTO.class.getMethods()) {
            String methodName = method.getName();
            try {
                if (methodName.startsWith("get") && !methodName.equals("getClass")) {
                    Object value = method.invoke(dto);
                    if (value instanceof String) {
                        String fieldName = toSnakeCase(methodName.substring(3));
                        setFieldValue(acroForm, fieldName, (String) value);
                    }
                } else if (methodName.startsWith("is")) {
                    Object value = method.invoke(dto);
                    if (value instanceof Boolean) {
                        String fieldName = toSnakeCase(methodName.substring(2));
                        setCheckboxValue(acroForm, fieldName, (Boolean) value);
                    }
                }
            } catch (Exception e) {
                log.warn("Error mapeando campo {}: {}", methodName, e.getMessage());
            }
        }
    }

    private String toSnakeCase(String camelCase) {
        StringBuilder sb = new StringBuilder();
        for (char c : camelCase.toCharArray()) {
            if (Character.isUpperCase(c)) {
                if (sb.length() > 0) sb.append('_');
                sb.append(Character.toLowerCase(c));
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    private void setFieldValue(PDAcroForm acroForm, String fieldName, String value) {
        if (value == null || value.trim().isEmpty()) return;
        PDField field = acroForm.getField(fieldName);
        if (field != null) {
            try {
                field.setValue(value);
            } catch (Exception e) {
                log.warn("No se pudo asignar '{}' a '{}'", value, fieldName);
            }
        }
    }

    private void setCheckboxValue(PDAcroForm acroForm, String fieldName, boolean value) {
        if (!value) return;
        PDField field = acroForm.getField(fieldName);
        if (field instanceof PDCheckBox) {
            try {
                ((PDCheckBox) field).check();
            } catch (Exception e) {
                log.warn("No se pudo marcar checkbox '{}'", fieldName);
            }
        }
    }
}
