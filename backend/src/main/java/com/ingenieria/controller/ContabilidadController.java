package com.ingenieria.controller;

import com.ingenieria.dto.CompraDocumentoDTO;
import com.ingenieria.dto.ContabilidadVentaDTO;
import com.ingenieria.service.ContabilidadService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/contabilidad")
@RequiredArgsConstructor
public class ContabilidadController {

    private final ContabilidadService contabilidadService;

    @GetMapping("/ventas")
    public List<ContabilidadVentaDTO> getVentas() {
        return contabilidadService.findAllVentas();
    }

    @GetMapping("/compras")
    public List<CompraDocumentoDTO> getCompras() {
        return contabilidadService.findAllCompras();
    }
}

