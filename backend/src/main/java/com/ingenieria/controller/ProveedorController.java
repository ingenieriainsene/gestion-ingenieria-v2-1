package com.ingenieria.controller;

import com.ingenieria.dto.ContactoDTO;
import com.ingenieria.dto.ProveedorCreateRequest;
import com.ingenieria.dto.ProveedorCreateResponse;
import com.ingenieria.dto.ProveedorDTO;
import com.ingenieria.dto.ProveedorDetailDTO;
import com.ingenieria.dto.ProveedorListDTO;
import com.ingenieria.service.ProveedorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/proveedores")

public class ProveedorController {

    @Autowired
    private ProveedorService service;

    @GetMapping
    public List<ProveedorListDTO> getAll() {
        return service.listarTodo();
    }

    @GetMapping("/{id}")
    public ProveedorDetailDTO getById(@PathVariable Long id) {
        return service.getDetail(id);
    }

    @PostMapping
    public ResponseEntity<ProveedorCreateResponse> create(@RequestBody ProveedorCreateRequest req) {
        return ResponseEntity.ok(service.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable Long id, @RequestBody ProveedorDTO dto) {
        service.update(id, dto);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/oficios")
    public ResponseEntity<Void> updateOficios(@PathVariable Long id, @RequestBody List<String> oficios) {
        service.updateOficios(id, oficios != null ? oficios : List.of());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/contactos")
    public ResponseEntity<ContactoDTO> addContact(@PathVariable Long id, @RequestBody ContactoDTO req) {
        return ResponseEntity.ok(service.addContact(id, req));
    }

    @PutMapping("/{id}/contactos/{idContacto}")
    public ResponseEntity<ContactoDTO> updateContact(
            @PathVariable Long id,
            @PathVariable Long idContacto,
            @RequestBody ContactoDTO req) {
        return ResponseEntity.ok(service.updateContact(id, idContacto, req));
    }

    @DeleteMapping("/{id}/contactos/{idContacto}")
    public ResponseEntity<Void> deleteContact(@PathVariable Long id, @PathVariable Long idContacto) {
        service.deleteContact(id, idContacto);
        return ResponseEntity.noContent().build();
    }
}
