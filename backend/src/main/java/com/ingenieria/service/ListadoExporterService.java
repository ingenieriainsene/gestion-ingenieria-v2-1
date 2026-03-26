package com.ingenieria.service;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ListadoExporterService {

    private final SpringTemplateEngine templateEngine;

    public byte[] exportToPdf(String titulo, List<String> headers, List<List<String>> rows) {
        Context ctx = new Context();
        ctx.setVariable("titulo", titulo);
        ctx.setVariable("headers", headers);
        ctx.setVariable("rows", rows);
        ctx.setVariable("logoBase64", loadLogoBase64().orElse(null));

        String html = templateEngine.process("listado-template", ctx);
        return htmlToPdf(html);
    }

    private byte[] htmlToPdf(String html) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(html);
            renderer.layout();
            renderer.createPDF(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error genererando el PDF del listado", e);
        }
    }

    private Optional<String> loadLogoBase64() {
        try {
            ClassPathResource imgFile = new ClassPathResource("static/images/logo.png");
            byte[] bytes = StreamUtils.copyToByteArray(imgFile.getInputStream());
            return Optional.of(Base64.getEncoder().encodeToString(bytes));
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
