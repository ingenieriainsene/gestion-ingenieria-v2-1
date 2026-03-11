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
public class CiePdfService {

    private static final Logger log = LoggerFactory.getLogger(CiePdfService.class);

    private static final String TEMPLATE_PATH = "plantilla_cie.pdf";
    private static final String FONT_PATH = "arial.ttf";

    public byte[] generarCie(CieRequestDTO dto) {
        ClassPathResource pdfResource = new ClassPathResource(TEMPLATE_PATH);
        ClassPathResource fontResource = new ClassPathResource(FONT_PATH);

        if (!pdfResource.exists()) {
            throw new IllegalStateException("No se encontró la plantilla del CIE: " + TEMPLATE_PATH);
        }
        if (!fontResource.exists()) {
            throw new IllegalStateException("No se encontró la fuente de texto: " + FONT_PATH);
        }

        try (InputStream isPdf = pdfResource.getInputStream();
                InputStream isFont = fontResource.getInputStream();
                PDDocument document = PDDocument.load(isPdf);
                ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            PDAcroForm acroForm = document.getDocumentCatalog().getAcroForm();
            if (acroForm == null) {
                throw new IllegalStateException("La plantilla del CIE no contiene un formulario AcroForm.");
            }

            // Cargar y configurar la fuente Arial
            PDType0Font customFont = PDType0Font.load(document, isFont);
            PDResources res = acroForm.getDefaultResources();
            if (res == null) {
                res = new PDResources();
                acroForm.setDefaultResources(res);
            }
            String fontName = res.add(customFont).getName();

            // RGB(0, 100, 0) -> R: 0, G: 100/255=0.3921, B: 0
            String defaultAppearance = "/" + fontName + " 10 Tf 0 0.3921 0 rg";

            // Iterar todos los campos para aplicar la fuente y el color a los campos de
            // texto
            for (PDField field : acroForm.getFieldTree()) {
                if (field instanceof PDVariableText) {
                    ((PDVariableText) field).setDefaultAppearance(defaultAppearance);
                }
            }

            // Poblar campos fijos
            setFieldValue(acroForm, "empresa_instaladora", "INSENE SOLAR, S.L.U.");
            setFieldValue(acroForm, "numero_registro_empresa", "B-90065483");
            setFieldValue(acroForm, "instalador_baja_tension", "MANUEL HIDALGO RODRIGUEZ");
            setFieldValue(acroForm, "dni_instalador", "28715797K");
            setCheckboxValue(acroForm, "chk_categoria_especialista", true);

            // Mapeo automático de los campos de texto del DTO
            mapDtoFieldsToAcroForm(dto, acroForm);

            // "Aplastar" el formulario para que el PDF ya no sea editable
            acroForm.flatten();

            document.save(baos);
            return baos.toByteArray();

        } catch (IOException e) {
            log.error("Error al generar el PDF del CIE.", e);
            throw new RuntimeException("Error al generar el PDF del CIE.", e);
        }
    }

    private void mapDtoFieldsToAcroForm(CieRequestDTO dto, PDAcroForm acroForm) {
        for (Method method : CieRequestDTO.class.getMethods()) {
            String methodName = method.getName();
            if (methodName.startsWith("get") && !methodName.equals("getClass")) {
                try {
                    Object value = method.invoke(dto);
                    if (value instanceof String) {
                        String fieldName = toSnakeCase(methodName.substring(3));
                        setFieldValue(acroForm, fieldName, (String) value);
                    }
                } catch (Exception e) {
                    log.warn("No se pudo invocar getter para Mapeo DTO -> AcroForm: {}", methodName, e);
                }
            } else if (methodName.startsWith("is")) {
                try {
                    Object value = method.invoke(dto);
                    if (value instanceof Boolean) {
                        String fieldName = toSnakeCase(methodName.substring(2));
                        setCheckboxValue(acroForm, fieldName, (Boolean) value);
                    }
                } catch (Exception e) {
                    log.warn("No se pudo invocar getter isX() para Mapeo DTO -> AcroForm: {}", methodName, e);
                }
            } else if (methodName.startsWith("getChk")) {
                try {
                    // lombok generates getChkInstalacionNueva() for boolean chkInstalacionNueva;
                    // wait, primitive boolean generates isX() normally, but if field name starts
                    // with is, it's tricky.
                    // A field 'boolean chkInstalacionNueva' generates 'isChkInstalacionNueva()' or
                    // 'getChkInstalacionNueva()'.
                    if (method.getReturnType().equals(boolean.class)) {
                        Object value = method.invoke(dto);
                        String fieldName = toSnakeCase(methodName.substring(3));
                        setCheckboxValue(acroForm, fieldName, (Boolean) value);
                    }
                } catch (Exception e) {
                    log.warn("No se pudo invocar getter getChkX() para Mapeo DTO -> AcroForm: {}", methodName, e);
                }
            }
        }
    }

    private String toSnakeCase(String camelCase) {
        StringBuilder sb = new StringBuilder();
        for (char c : camelCase.toCharArray()) {
            if (Character.isUpperCase(c)) {
                if (sb.length() > 0) {
                    sb.append('_');
                }
                sb.append(Character.toLowerCase(c));
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    private void setFieldValue(PDAcroForm acroForm, String fieldName, String value) {
        if (value == null || value.trim().isEmpty()) {
            return;
        }
        PDField field = acroForm.getField(fieldName);
        if (field != null) {
            try {
                field.setValue(value);
            } catch (Exception e) {
                log.warn("No se pudo asignar el valor '{}' al campo de texto '{}'", value, fieldName, e);
            }
        } else {
            log.trace("Campo de texto '{}' no encontrado en el AcroForm.", fieldName);
        }
    }

    private void setCheckboxValue(PDAcroForm acroForm, String fieldName, boolean value) {
        if (!value)
            return; // Si es falso, no marcamos nada, por defecto estará desmarcado
        PDField field = acroForm.getField(fieldName);
        if (field instanceof PDCheckBox) {
            try {
                ((PDCheckBox) field).check();
            } catch (Exception e) {
                log.warn("No se pudo hacer check en el campo booleano '{}'", fieldName, e);
            }
        } else if (field != null) {
            // Un field puede que no sea reconocido como PDCheckBox sino como un campo de
            // texto con valor Yes/Off
            try {
                field.setValue("Yes");
            } catch (Exception e) {
                log.warn("Falló setValue('Yes') en el campo '{}'", fieldName, e);
            }
        } else {
            log.trace("Campo booleano '{}' no encontrado en el AcroForm.", fieldName);
        }
    }
}
